"""
Secure Data & Compute Plane Configuration
BioTensor Labs Medical AGI
"""

from typing import Dict, List, Optional
from pydantic import BaseSettings, SecretStr, Field
from enum import Enum


class PurposeOfUse(str, Enum):
    """HIPAA-compliant purpose of use codes"""
    TREATMENT = "TREATMENT"
    PAYMENT = "PAYMENT"
    OPERATIONS = "OPERATIONS"
    RESEARCH = "RESEARCH"
    PUBLIC_HEALTH = "PUBLIC_HEALTH"
    EMERGENCY = "EMERGENCY"


class DataClassification(str, Enum):
    """Data sensitivity levels"""
    PHI = "PHI"  # Protected Health Information
    PII = "PII"  # Personally Identifiable Information
    SENSITIVE = "SENSITIVE"  # Non-PHI sensitive data
    INTERNAL = "INTERNAL"  # Internal use only
    PUBLIC = "PUBLIC"  # Publicly shareable


class SecurityConfig(BaseSettings):
    """Security configuration for the compute plane"""
    
    # Encryption settings
    encryption_algorithm: str = Field(default="AES-256-GCM")
    kms_endpoint: str = Field(default="https://kms.internal.biotensor.ai")
    kms_key_id: SecretStr
    
    # Authentication
    auth_provider: str = Field(default="oidc")
    oidc_issuer: str = Field(default="https://auth.biotensor.ai")
    oidc_client_id: str
    oidc_client_secret: SecretStr
    jwt_algorithm: str = Field(default="RS256")
    jwt_expiry_seconds: int = Field(default=3600)
    
    # Authorization
    opa_endpoint: str = Field(default="http://opa:8181")
    policy_bundle: str = Field(default="biotensor-clinical")
    
    # Network security
    mtls_required: bool = Field(default=True)
    ca_cert_path: str = Field(default="/certs/ca.crt")
    server_cert_path: str = Field(default="/certs/server.crt")
    server_key_path: str = Field(default="/certs/server.key")
    
    # Audit settings
    audit_endpoint: str = Field(default="https://audit.biotensor.ai")
    audit_retention_days: int = Field(default=2555)  # 7 years
    
    # PHI isolation
    phi_vpc_id: str
    compute_vpc_id: str
    vpc_peering_enabled: bool = Field(default=False)
    
    class Config:
        env_prefix = "BIOTENSOR_"
        case_sensitive = False


class ComplianceConfig(BaseSettings):
    """Compliance and governance configuration"""
    
    # HIPAA settings
    hipaa_mode: bool = Field(default=True)
    minimum_necessary_rule: bool = Field(default=True)
    consent_required: bool = Field(default=True)
    
    # De-identification
    deidentification_mode: str = Field(default="safe_harbor")
    phi_fields: List[str] = Field(default=[
        "patient_name", "mrn", "ssn", "address", "phone",
        "email", "dob", "admission_date", "discharge_date"
    ])
    
    # Audit requirements
    audit_all_phi_access: bool = Field(default=True)
    audit_failed_access: bool = Field(default=True)
    audit_data_exports: bool = Field(default=True)
    
    # Data governance
    data_retention_policy: Dict[str, int] = Field(default={
        "clinical_notes": 2555,  # 7 years
        "lab_results": 2555,
        "imaging": 2555,
        "audit_logs": 2555,
        "ml_predictions": 365,  # 1 year
        "temporary_cache": 7
    })
    
    # Consent management
    consent_service_url: str = Field(default="https://consent.biotensor.ai")
    consent_check_required: bool = Field(default=True)
    
    class Config:
        env_prefix = "BIOTENSOR_COMPLIANCE_"


class ComputeConfig(BaseSettings):
    """Compute resource configuration"""
    
    # Kubernetes settings
    k8s_namespace: str = Field(default="biotensor-agi")
    k8s_context: str = Field(default="biotensor-prod")
    
    # Resource limits
    cpu_request: str = Field(default="2")
    cpu_limit: str = Field(default="4")
    memory_request: str = Field(default="8Gi")
    memory_limit: str = Field(default="16Gi")
    gpu_request: int = Field(default=0)
    
    # Storage
    storage_class: str = Field(default="phi-encrypted")
    pvc_size: str = Field(default="100Gi")
    
    # Autoscaling
    autoscaling_enabled: bool = Field(default=True)
    min_replicas: int = Field(default=2)
    max_replicas: int = Field(default=10)
    target_cpu_utilization: int = Field(default=70)
    
    # Batch processing
    ray_cluster_endpoint: str = Field(default="ray://ray-head:10001")
    spark_master: str = Field(default="spark://spark-master:7077")
    
    class Config:
        env_prefix = "BIOTENSOR_COMPUTE_"


# Global config instances
security_config = SecurityConfig()
compliance_config = ComplianceConfig()
compute_config = ComputeConfig()