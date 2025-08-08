"""
FHIR Client for Clinical Data Ingestion
BioTensor Labs Medical AGI
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import httpx
from fhirclient import client
from fhirclient.models import (
    patient, observation, condition, medicationrequest,
    procedure, diagnosticreport, imagingstudy, encounter
)
import pandas as pd
from pydantic import BaseModel, Field

from ..secure_plane.config import SecurityConfig, PurposeOfUse


logger = logging.getLogger(__name__)


class FHIRConfig(BaseModel):
    """FHIR server configuration"""
    base_url: str = Field(default="https://fhir.biotensor.ai/r4")
    auth_type: str = Field(default="oauth2")  # oauth2, basic, smart
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    scope: str = Field(default="system/*.read")
    timeout: int = Field(default=30)
    max_retries: int = Field(default=3)
    batch_size: int = Field(default=100)


class FHIRResource(BaseModel):
    """Normalized FHIR resource"""
    resource_type: str
    id: str
    patient_id: str
    timestamp: datetime
    data: Dict[str, Any]
    terminology_codes: Dict[str, List[str]] = Field(default_factory=dict)
    phi_fields: List[str] = Field(default_factory=list)
    

class FHIRClient:
    """Async FHIR client with security and normalization"""
    
    def __init__(self, config: FHIRConfig, security_config: SecurityConfig):
        self.config = config
        self.security = security_config
        self._client = None
        self._http_client = None
        self._access_token = None
        self._token_expiry = None
        
    async def __aenter__(self):
        await self.connect()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.disconnect()
        
    async def connect(self):
        """Initialize FHIR connection with authentication"""
        self._http_client = httpx.AsyncClient(
            timeout=self.config.timeout,
            verify=self.security.ca_cert_path if self.security.mtls_required else True
        )
        
        if self.config.auth_type == "oauth2":
            await self._authenticate_oauth()
        
        # Initialize FHIR client
        settings = {
            'app_id': 'biotensor_agi',
            'api_base': self.config.base_url
        }
        self._client = client.FHIRClient(settings=settings)
        
    async def disconnect(self):
        """Close connections"""
        if self._http_client:
            await self._http_client.aclose()
            
    async def _authenticate_oauth(self):
        """OAuth2 authentication flow"""
        token_url = f"{self.security.oidc_issuer}/token"
        
        data = {
            "grant_type": "client_credentials",
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret,
            "scope": self.config.scope
        }
        
        response = await self._http_client.post(token_url, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        self._access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 3600)
        self._token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)
        
    async def _ensure_authenticated(self):
        """Ensure we have a valid access token"""
        if self.config.auth_type != "oauth2":
            return
            
        if not self._access_token or datetime.utcnow() >= self._token_expiry:
            await self._authenticate_oauth()
            
    async def _make_request(self, method: str, url: str, **kwargs) -> httpx.Response:
        """Make authenticated HTTP request"""
        await self._ensure_authenticated()
        
        headers = kwargs.get("headers", {})
        if self._access_token:
            headers["Authorization"] = f"Bearer {self._access_token}"
        
        kwargs["headers"] = headers
        
        for attempt in range(self.config.max_retries):
            try:
                response = await self._http_client.request(method, url, **kwargs)
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401 and attempt < self.config.max_retries - 1:
                    # Token might be expired, try refreshing
                    await self._authenticate_oauth()
                    continue
                raise
            except Exception as e:
                if attempt < self.config.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
                raise
                
    async def get_patient(self, patient_id: str) -> Optional[FHIRResource]:
        """Fetch patient resource"""
        try:
            url = f"{self.config.base_url}/Patient/{patient_id}"
            response = await self._make_request("GET", url)
            data = response.json()
            
            return self._normalize_patient(data)
        except Exception as e:
            logger.error(f"Error fetching patient {patient_id}: {e}")
            return None
            
    async def get_observations(
        self, 
        patient_id: str,
        code: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 1000
    ) -> List[FHIRResource]:
        """Fetch observations for a patient"""
        params = {
            "patient": patient_id,
            "_count": min(limit, self.config.batch_size),
            "_sort": "-date"
        }
        
        if code:
            params["code"] = code
        if date_from:
            params["date"] = f"ge{date_from.isoformat()}"
        if date_to:
            if "date" in params:
                params["date"] += f"&le{date_to.isoformat()}"
            else:
                params["date"] = f"le{date_to.isoformat()}"
                
        observations = []
        url = f"{self.config.base_url}/Observation"
        
        while url and len(observations) < limit:
            response = await self._make_request("GET", url, params=params)
            bundle = response.json()
            
            if "entry" in bundle:
                for entry in bundle["entry"]:
                    resource = entry.get("resource", {})
                    normalized = self._normalize_observation(resource)
                    if normalized:
                        observations.append(normalized)
                        
            # Check for next page
            url = None
            for link in bundle.get("link", []):
                if link.get("relation") == "next":
                    url = link.get("url")
                    params = {}  # URL already has params
                    break
                    
        return observations[:limit]
        
    async def get_conditions(
        self,
        patient_id: str,
        clinical_status: Optional[str] = None,
        limit: int = 1000
    ) -> List[FHIRResource]:
        """Fetch conditions for a patient"""
        params = {
            "patient": patient_id,
            "_count": min(limit, self.config.batch_size)
        }
        
        if clinical_status:
            params["clinical-status"] = clinical_status
            
        conditions = []
        url = f"{self.config.base_url}/Condition"
        
        response = await self._make_request("GET", url, params=params)
        bundle = response.json()
        
        if "entry" in bundle:
            for entry in bundle["entry"]:
                resource = entry.get("resource", {})
                normalized = self._normalize_condition(resource)
                if normalized:
                    conditions.append(normalized)
                    
        return conditions
        
    async def get_medications(
        self,
        patient_id: str,
        status: Optional[str] = "active",
        limit: int = 1000
    ) -> List[FHIRResource]:
        """Fetch medications for a patient"""
        params = {
            "patient": patient_id,
            "_count": min(limit, self.config.batch_size)
        }
        
        if status:
            params["status"] = status
            
        medications = []
        url = f"{self.config.base_url}/MedicationRequest"
        
        response = await self._make_request("GET", url, params=params)
        bundle = response.json()
        
        if "entry" in bundle:
            for entry in bundle["entry"]:
                resource = entry.get("resource", {})
                normalized = self._normalize_medication(resource)
                if normalized:
                    medications.append(normalized)
                    
        return medications
        
    def _normalize_patient(self, resource: Dict) -> FHIRResource:
        """Normalize patient resource"""
        patient_id = resource.get("id", "")
        
        # Extract key fields
        name = ""
        if "name" in resource and resource["name"]:
            name_parts = resource["name"][0]
            given = " ".join(name_parts.get("given", []))
            family = name_parts.get("family", "")
            name = f"{given} {family}".strip()
            
        return FHIRResource(
            resource_type="Patient",
            id=patient_id,
            patient_id=patient_id,
            timestamp=datetime.utcnow(),
            data={
                "name": name,
                "gender": resource.get("gender"),
                "birthDate": resource.get("birthDate"),
                "identifier": resource.get("identifier", [])
            },
            phi_fields=["name", "birthDate", "identifier"]
        )
        
    def _normalize_observation(self, resource: Dict) -> Optional[FHIRResource]:
        """Normalize observation resource"""
        obs_id = resource.get("id", "")
        patient_ref = resource.get("subject", {}).get("reference", "")
        patient_id = patient_ref.split("/")[-1] if patient_ref else ""
        
        if not patient_id:
            return None
            
        # Extract timestamp
        timestamp = resource.get("effectiveDateTime")
        if timestamp:
            timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        else:
            timestamp = datetime.utcnow()
            
        # Extract codes
        codes = {}
        if "code" in resource and "coding" in resource["code"]:
            for coding in resource["code"]["coding"]:
                system = coding.get("system", "")
                code = coding.get("code", "")
                if system and code:
                    if system not in codes:
                        codes[system] = []
                    codes[system].append(code)
                    
        # Extract value
        value = None
        unit = None
        if "valueQuantity" in resource:
            value = resource["valueQuantity"].get("value")
            unit = resource["valueQuantity"].get("unit")
        elif "valueCodeableConcept" in resource:
            value = resource["valueCodeableConcept"].get("text")
            
        return FHIRResource(
            resource_type="Observation",
            id=obs_id,
            patient_id=patient_id,
            timestamp=timestamp,
            data={
                "status": resource.get("status"),
                "category": resource.get("category"),
                "code": resource.get("code"),
                "value": value,
                "unit": unit,
                "interpretation": resource.get("interpretation"),
                "referenceRange": resource.get("referenceRange")
            },
            terminology_codes=codes
        )
        
    def _normalize_condition(self, resource: Dict) -> Optional[FHIRResource]:
        """Normalize condition resource"""
        condition_id = resource.get("id", "")
        patient_ref = resource.get("subject", {}).get("reference", "")
        patient_id = patient_ref.split("/")[-1] if patient_ref else ""
        
        if not patient_id:
            return None
            
        # Extract onset date
        onset = resource.get("onsetDateTime")
        if onset:
            timestamp = datetime.fromisoformat(onset.replace("Z", "+00:00"))
        else:
            timestamp = datetime.utcnow()
            
        # Extract codes
        codes = {}
        if "code" in resource and "coding" in resource["code"]:
            for coding in resource["code"]["coding"]:
                system = coding.get("system", "")
                code = coding.get("code", "")
                if system and code:
                    if system not in codes:
                        codes[system] = []
                    codes[system].append(code)
                    
        return FHIRResource(
            resource_type="Condition",
            id=condition_id,
            patient_id=patient_id,
            timestamp=timestamp,
            data={
                "clinicalStatus": resource.get("clinicalStatus"),
                "verificationStatus": resource.get("verificationStatus"),
                "category": resource.get("category"),
                "severity": resource.get("severity"),
                "code": resource.get("code"),
                "onsetDateTime": onset,
                "abatementDateTime": resource.get("abatementDateTime")
            },
            terminology_codes=codes
        )
        
    def _normalize_medication(self, resource: Dict) -> Optional[FHIRResource]:
        """Normalize medication request resource"""
        med_id = resource.get("id", "")
        patient_ref = resource.get("subject", {}).get("reference", "")
        patient_id = patient_ref.split("/")[-1] if patient_ref else ""
        
        if not patient_id:
            return None
            
        # Extract authored date
        authored = resource.get("authoredOn")
        if authored:
            timestamp = datetime.fromisoformat(authored.replace("Z", "+00:00"))
        else:
            timestamp = datetime.utcnow()
            
        # Extract medication codes
        codes = {}
        med_ref = resource.get("medicationReference")
        med_concept = resource.get("medicationCodeableConcept")
        
        if med_concept and "coding" in med_concept:
            for coding in med_concept["coding"]:
                system = coding.get("system", "")
                code = coding.get("code", "")
                if system and code:
                    if system not in codes:
                        codes[system] = []
                    codes[system].append(code)
                    
        return FHIRResource(
            resource_type="MedicationRequest",
            id=med_id,
            patient_id=patient_id,
            timestamp=timestamp,
            data={
                "status": resource.get("status"),
                "intent": resource.get("intent"),
                "priority": resource.get("priority"),
                "medicationCodeableConcept": med_concept,
                "dosageInstruction": resource.get("dosageInstruction"),
                "dispenseRequest": resource.get("dispenseRequest")
            },
            terminology_codes=codes
        )