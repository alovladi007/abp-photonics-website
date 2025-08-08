"""
Agent Orchestration Layer
BioTensor Labs Medical AGI
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union, Callable
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
import json
from abc import ABC, abstractmethod

from pydantic import BaseModel, Field
import ray
from ray import serve

from ..secure_plane.config import PurposeOfUse, DataClassification
from ..tools.clinical_calculators import CalculatorResult


logger = logging.getLogger(__name__)


class TaskType(str, Enum):
    """Types of clinical tasks"""
    TRIAGE = "triage"
    DIAGNOSIS = "diagnosis"
    TREATMENT_PLANNING = "treatment_planning"
    RISK_ASSESSMENT = "risk_assessment"
    IMAGING_ANALYSIS = "imaging_analysis"
    LAB_INTERPRETATION = "lab_interpretation"
    MEDICATION_REVIEW = "medication_review"
    CARE_COORDINATION = "care_coordination"
    RESEARCH_QUERY = "research_query"
    EDUCATION = "education"


class TaskPriority(str, Enum):
    """Task priority levels"""
    STAT = "stat"  # Immediate
    URGENT = "urgent"  # Within 30 minutes
    ROUTINE = "routine"  # Within hours
    SCHEDULED = "scheduled"  # As scheduled


class AgentRole(str, Enum):
    """Specialized agent roles"""
    TRIAGE_AGENT = "triage"
    DIAGNOSTIC_AGENT = "diagnostic"
    THERAPY_AGENT = "therapy"
    RADIOLOGY_AGENT = "radiology"
    PATHOLOGY_AGENT = "pathology"
    ICU_AGENT = "icu"
    RESEARCH_AGENT = "research"
    EDUCATION_AGENT = "education"


@dataclass
class ClinicalContext:
    """Context for clinical decision making"""
    patient_id: str
    encounter_id: Optional[str] = None
    purpose_of_use: PurposeOfUse = PurposeOfUse.TREATMENT
    user_role: str = "physician"
    urgency: TaskPriority = TaskPriority.ROUTINE
    available_data: Dict[str, bool] = field(default_factory=dict)
    constraints: Dict[str, Any] = field(default_factory=dict)
    audit_trail: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class TaskRequest:
    """Request for agent processing"""
    id: str
    type: TaskType
    context: ClinicalContext
    query: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    timeout_seconds: int = 300  # 5 minutes default


@dataclass
class TaskResult:
    """Result from agent processing"""
    task_id: str
    status: str  # success, partial, failed
    primary_output: Any
    confidence: float
    uncertainty_factors: List[str] = field(default_factory=list)
    recommendations: List[Dict[str, Any]] = field(default_factory=list)
    evidence: List[Dict[str, Any]] = field(default_factory=list)
    provenance: List[Dict[str, Any]] = field(default_factory=list)
    tools_used: List[str] = field(default_factory=list)
    processing_time_ms: int = 0
    safety_checks: Dict[str, bool] = field(default_factory=dict)
    

class BaseAgent(ABC):
    """Base class for all clinical agents"""
    
    def __init__(self, role: AgentRole):
        self.role = role
        self.logger = logging.getLogger(f"{__name__}.{role.value}")
        
    @abstractmethod
    async def process(self, request: TaskRequest) -> TaskResult:
        """Process a task request"""
        pass
        
    async def validate_request(self, request: TaskRequest) -> List[str]:
        """Validate request has required data"""
        errors = []
        
        # Check basic requirements
        if not request.context.patient_id:
            errors.append("Patient ID required")
            
        # Role-specific validation
        if self.role == AgentRole.DIAGNOSTIC_AGENT:
            if not request.context.available_data.get("observations"):
                errors.append("Clinical observations required for diagnosis")
                
        return errors
        
    def log_action(self, request: TaskRequest, action: str, details: Dict[str, Any]):
        """Log action for audit trail"""
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "agent": self.role.value,
            "action": action,
            "task_id": request.id,
            "patient_id": request.context.patient_id,
            "user_role": request.context.user_role,
            "purpose_of_use": request.context.purpose_of_use.value,
            "details": details
        }
        request.context.audit_trail.append(entry)
        self.logger.info(f"Action logged: {action}", extra=entry)


class TriageAgent(BaseAgent):
    """Agent for patient triage and prioritization"""
    
    def __init__(self):
        super().__init__(AgentRole.TRIAGE_AGENT)
        
    async def process(self, request: TaskRequest) -> TaskResult:
        """Process triage request"""
        start_time = datetime.utcnow()
        
        # Validate request
        errors = await self.validate_request(request)
        if errors:
            return TaskResult(
                task_id=request.id,
                status="failed",
                primary_output={"errors": errors},
                confidence=0.0
            )
            
        # Extract chief complaint and vitals
        chief_complaint = request.parameters.get("chief_complaint", "")
        vitals = request.parameters.get("vitals", {})
        
        # Determine urgency based on complaint and vitals
        urgency_score = await self._calculate_urgency(chief_complaint, vitals)
        
        # Determine appropriate pathway
        pathway = await self._determine_pathway(chief_complaint, urgency_score)
        
        # Generate recommendations
        recommendations = await self._generate_triage_recommendations(
            chief_complaint, vitals, urgency_score, pathway
        )
        
        # Log action
        self.log_action(request, "triage_completed", {
            "urgency_score": urgency_score,
            "pathway": pathway,
            "recommendations": len(recommendations)
        })
        
        # Calculate processing time
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        return TaskResult(
            task_id=request.id,
            status="success",
            primary_output={
                "urgency_score": urgency_score,
                "triage_category": self._score_to_category(urgency_score),
                "recommended_pathway": pathway,
                "estimated_wait_time": self._estimate_wait_time(urgency_score)
            },
            confidence=0.85,
            recommendations=recommendations,
            tools_used=["urgency_calculator", "pathway_determiner"],
            processing_time_ms=processing_time,
            safety_checks={
                "vital_signs_critical": self._check_critical_vitals(vitals),
                "red_flags_present": self._check_red_flags(chief_complaint)
            }
        )
        
    async def _calculate_urgency(self, complaint: str, vitals: Dict[str, Any]) -> float:
        """Calculate urgency score (0-100)"""
        score = 50.0  # Base score
        
        # Vital sign modifiers
        hr = vitals.get("heart_rate", 80)
        if hr > 120 or hr < 50:
            score += 20
        elif hr > 100 or hr < 60:
            score += 10
            
        bp_sys = vitals.get("bp_systolic", 120)
        if bp_sys > 180 or bp_sys < 90:
            score += 20
        elif bp_sys > 140 or bp_sys < 100:
            score += 10
            
        # Complaint modifiers
        critical_complaints = ["chest pain", "difficulty breathing", "stroke", "trauma"]
        urgent_complaints = ["severe pain", "bleeding", "fever", "vomiting"]
        
        complaint_lower = complaint.lower()
        if any(cc in complaint_lower for cc in critical_complaints):
            score += 30
        elif any(uc in complaint_lower for uc in urgent_complaints):
            score += 15
            
        return min(100, max(0, score))
        
    async def _determine_pathway(self, complaint: str, urgency_score: float) -> str:
        """Determine care pathway"""
        if urgency_score >= 80:
            return "emergency_department"
        elif urgency_score >= 60:
            return "urgent_care"
        elif "follow-up" in complaint.lower():
            return "primary_care"
        else:
            return "nurse_triage"
            
    async def _generate_triage_recommendations(
        self, complaint: str, vitals: Dict, score: float, pathway: str
    ) -> List[Dict[str, Any]]:
        """Generate triage recommendations"""
        recommendations = []
        
        if score >= 80:
            recommendations.append({
                "action": "immediate_evaluation",
                "priority": "stat",
                "reason": "Critical urgency score"
            })
            
        if pathway == "emergency_department":
            recommendations.append({
                "action": "activate_ed_protocol",
                "priority": "urgent",
                "protocols": self._get_ed_protocols(complaint)
            })
            
        return recommendations
        
    def _score_to_category(self, score: float) -> str:
        """Convert urgency score to triage category"""
        if score >= 90:
            return "ESI-1"  # Resuscitation
        elif score >= 70:
            return "ESI-2"  # Emergent
        elif score >= 50:
            return "ESI-3"  # Urgent
        elif score >= 30:
            return "ESI-4"  # Less urgent
        else:
            return "ESI-5"  # Non-urgent
            
    def _estimate_wait_time(self, score: float) -> str:
        """Estimate wait time based on urgency"""
        if score >= 90:
            return "Immediate"
        elif score >= 70:
            return "< 10 minutes"
        elif score >= 50:
            return "< 30 minutes"
        elif score >= 30:
            return "< 60 minutes"
        else:
            return "< 120 minutes"
            
    def _check_critical_vitals(self, vitals: Dict[str, Any]) -> bool:
        """Check for critical vital signs"""
        hr = vitals.get("heart_rate", 80)
        bp_sys = vitals.get("bp_systolic", 120)
        rr = vitals.get("respiratory_rate", 16)
        spo2 = vitals.get("spo2", 98)
        
        return (
            hr > 130 or hr < 40 or
            bp_sys > 200 or bp_sys < 80 or
            rr > 30 or rr < 8 or
            spo2 < 90
        )
        
    def _check_red_flags(self, complaint: str) -> bool:
        """Check for red flag symptoms"""
        red_flags = [
            "chest pain", "crushing", "radiating",
            "stroke", "weakness", "numbness",
            "difficulty breathing", "shortness of breath",
            "severe bleeding", "unconscious", "unresponsive"
        ]
        complaint_lower = complaint.lower()
        return any(flag in complaint_lower for flag in red_flags)
        
    def _get_ed_protocols(self, complaint: str) -> List[str]:
        """Get relevant ED protocols"""
        protocols = []
        complaint_lower = complaint.lower()
        
        if "chest pain" in complaint_lower:
            protocols.extend(["ACS", "EKG", "Troponin"])
        if "stroke" in complaint_lower:
            protocols.extend(["Stroke Alert", "CT Head", "NIH Stroke Scale"])
        if "trauma" in complaint_lower:
            protocols.extend(["Trauma Team", "FAST Exam", "CT Trauma"])
            
        return protocols


class DiagnosticAgent(BaseAgent):
    """Agent for diagnostic reasoning and differential diagnosis"""
    
    def __init__(self):
        super().__init__(AgentRole.DIAGNOSTIC_AGENT)
        self.differential_threshold = 0.1  # Include diagnoses with >10% probability
        
    async def process(self, request: TaskRequest) -> TaskResult:
        """Process diagnostic request"""
        start_time = datetime.utcnow()
        
        # Extract patient data
        symptoms = request.parameters.get("symptoms", [])
        observations = request.parameters.get("observations", [])
        history = request.parameters.get("history", [])
        
        # Generate differential diagnosis
        differential = await self._generate_differential(symptoms, observations, history)
        
        # Rank diagnoses by probability
        ranked_differential = await self._rank_diagnoses(differential, observations)
        
        # Identify missing data that could refine diagnosis
        missing_data = await self._identify_missing_data(ranked_differential)
        
        # Generate diagnostic recommendations
        recommendations = await self._generate_diagnostic_plan(
            ranked_differential, missing_data
        )
        
        # Calculate diagnostic confidence
        confidence = self._calculate_diagnostic_confidence(ranked_differential, missing_data)
        
        # Log action
        self.log_action(request, "diagnosis_generated", {
            "differential_count": len(ranked_differential),
            "top_diagnosis": ranked_differential[0]["diagnosis"] if ranked_differential else None,
            "confidence": confidence
        })
        
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        return TaskResult(
            task_id=request.id,
            status="success",
            primary_output={
                "differential_diagnosis": ranked_differential,
                "missing_data": missing_data,
                "diagnostic_confidence": confidence
            },
            confidence=confidence,
            uncertainty_factors=missing_data,
            recommendations=recommendations,
            tools_used=["differential_generator", "diagnosis_ranker", "gap_analyzer"],
            processing_time_ms=processing_time,
            safety_checks={
                "critical_findings": await self._check_critical_findings(observations),
                "diagnostic_certainty_adequate": confidence > 0.7
            }
        )
        
    async def _generate_differential(
        self, symptoms: List[str], observations: List[Dict], history: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Generate differential diagnosis list"""
        # This would integrate with medical knowledge base
        # For now, simplified logic
        differential = []
        
        # Example pattern matching
        symptom_set = set(s.lower() for s in symptoms)
        
        if "chest pain" in symptom_set:
            differential.extend([
                {"diagnosis": "Acute Coronary Syndrome", "icd10": "I21.9", "category": "cardiac"},
                {"diagnosis": "Pulmonary Embolism", "icd10": "I26.9", "category": "pulmonary"},
                {"diagnosis": "Gastroesophageal Reflux", "icd10": "K21.9", "category": "gi"},
                {"diagnosis": "Costochondritis", "icd10": "M94.0", "category": "musculoskeletal"}
            ])
            
        if "fever" in symptom_set and "cough" in symptom_set:
            differential.extend([
                {"diagnosis": "Pneumonia", "icd10": "J18.9", "category": "infectious"},
                {"diagnosis": "COVID-19", "icd10": "U07.1", "category": "infectious"},
                {"diagnosis": "Influenza", "icd10": "J11.1", "category": "infectious"}
            ])
            
        return differential
        
    async def _rank_diagnoses(
        self, differential: List[Dict], observations: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Rank diagnoses by probability"""
        # Simplified ranking based on supporting evidence
        for dx in differential:
            score = 0.5  # Base probability
            
            # Adjust based on observations
            for obs in observations:
                if self._observation_supports_diagnosis(obs, dx):
                    score += 0.1
                elif self._observation_contradicts_diagnosis(obs, dx):
                    score -= 0.2
                    
            dx["probability"] = max(0.01, min(0.99, score))
            dx["supporting_evidence"] = []  # Would be populated with actual evidence
            dx["contradicting_evidence"] = []
            
        # Sort by probability
        ranked = sorted(differential, key=lambda x: x["probability"], reverse=True)
        
        # Filter by threshold
        return [dx for dx in ranked if dx["probability"] >= self.differential_threshold]
        
    async def _identify_missing_data(self, differential: List[Dict]) -> List[str]:
        """Identify data that could refine diagnosis"""
        missing = []
        
        if not differential:
            return ["Initial clinical assessment needed"]
            
        top_diagnosis = differential[0]
        
        # Based on top diagnoses, identify useful tests
        if top_diagnosis["category"] == "cardiac":
            missing.extend(["ECG", "Troponin", "Echocardiogram"])
        elif top_diagnosis["category"] == "infectious":
            missing.extend(["CBC with differential", "Blood cultures", "Chest X-ray"])
            
        return missing
        
    async def _generate_diagnostic_plan(
        self, differential: List[Dict], missing_data: List[str]
    ) -> List[Dict[str, Any]]:
        """Generate diagnostic recommendations"""
        recommendations = []
        
        # Recommend tests based on differential
        if missing_data:
            recommendations.append({
                "action": "order_tests",
                "tests": missing_data[:3],  # Top 3 most useful
                "priority": "urgent" if differential[0]["probability"] > 0.7 else "routine",
                "rationale": f"To differentiate between top diagnoses"
            })
            
        # Recommend consultations if needed
        if differential and differential[0]["category"] == "cardiac":
            recommendations.append({
                "action": "consultation",
                "specialty": "cardiology",
                "priority": "urgent",
                "rationale": "Cardiac etiology suspected"
            })
            
        return recommendations
        
    def _calculate_diagnostic_confidence(
        self, differential: List[Dict], missing_data: List[str]
    ) -> float:
        """Calculate overall diagnostic confidence"""
        if not differential:
            return 0.1
            
        # Base confidence on top diagnosis probability
        confidence = differential[0]["probability"]
        
        # Reduce confidence based on missing data
        confidence *= (1 - 0.05 * len(missing_data))
        
        # Reduce confidence if multiple similar probabilities
        if len(differential) > 1:
            prob_spread = differential[0]["probability"] - differential[1]["probability"]
            if prob_spread < 0.2:
                confidence *= 0.8
                
        return max(0.1, min(0.95, confidence))
        
    def _observation_supports_diagnosis(self, obs: Dict, diagnosis: Dict) -> bool:
        """Check if observation supports diagnosis"""
        # Simplified logic - would use medical knowledge base
        return False
        
    def _observation_contradicts_diagnosis(self, obs: Dict, diagnosis: Dict) -> bool:
        """Check if observation contradicts diagnosis"""
        # Simplified logic - would use medical knowledge base
        return False
        
    async def _check_critical_findings(self, observations: List[Dict]) -> bool:
        """Check for critical findings requiring immediate action"""
        # Would check for critical values, life-threatening conditions
        return False


@ray.remote
class AgentOrchestrator:
    """Main orchestrator for coordinating agents"""
    
    def __init__(self):
        self.agents = {
            AgentRole.TRIAGE_AGENT: TriageAgent(),
            AgentRole.DIAGNOSTIC_AGENT: DiagnosticAgent(),
            # Add other agents as implemented
        }
        self.task_queue = asyncio.Queue()
        self.active_tasks = {}
        self.logger = logging.getLogger(__name__)
        
    async def submit_task(self, request: TaskRequest) -> str:
        """Submit task for processing"""
        await self.task_queue.put(request)
        self.active_tasks[request.id] = {
            "status": "queued",
            "submitted_at": datetime.utcnow()
        }
        return request.id
        
    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get status of a task"""
        return self.active_tasks.get(task_id, {"status": "not_found"})
        
    async def process_tasks(self):
        """Main task processing loop"""
        while True:
            try:
                request = await self.task_queue.get()
                self.active_tasks[request.id]["status"] = "processing"
                
                # Route to appropriate agent
                agent = self._route_task(request)
                if not agent:
                    self.active_tasks[request.id] = {
                        "status": "failed",
                        "error": "No agent available for task type"
                    }
                    continue
                    
                # Process task
                result = await agent.process(request)
                
                # Store result
                self.active_tasks[request.id] = {
                    "status": "completed",
                    "result": result,
                    "completed_at": datetime.utcnow()
                }
                
            except Exception as e:
                self.logger.error(f"Error processing task: {e}")
                if request:
                    self.active_tasks[request.id] = {
                        "status": "failed",
                        "error": str(e)
                    }
                    
    def _route_task(self, request: TaskRequest) -> Optional[BaseAgent]:
        """Route task to appropriate agent"""
        routing_map = {
            TaskType.TRIAGE: AgentRole.TRIAGE_AGENT,
            TaskType.DIAGNOSIS: AgentRole.DIAGNOSTIC_AGENT,
            TaskType.RISK_ASSESSMENT: AgentRole.DIAGNOSTIC_AGENT,
            # Add more mappings
        }
        
        agent_role = routing_map.get(request.type)
        if agent_role:
            return self.agents.get(agent_role)
        return None