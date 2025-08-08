"""
Unified Clinical Knowledge Graph Schema
BioTensor Labs Medical AGI
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
import neo4j
from neo4j import GraphDatabase


class NodeType(str, Enum):
    """Types of nodes in the clinical knowledge graph"""
    # Clinical entities
    PATIENT = "Patient"
    ENCOUNTER = "Encounter"
    CONDITION = "Condition"
    OBSERVATION = "Observation"
    MEDICATION = "Medication"
    PROCEDURE = "Procedure"
    DIAGNOSTIC_REPORT = "DiagnosticReport"
    IMAGING_STUDY = "ImagingStudy"
    
    # Knowledge entities
    DISEASE = "Disease"
    DRUG = "Drug"
    GENE = "Gene"
    PROTEIN = "Protein"
    PATHWAY = "Pathway"
    GUIDELINE = "Guideline"
    CLINICAL_TRIAL = "ClinicalTrial"
    
    # Terminology
    CONCEPT = "Concept"
    CODE_SYSTEM = "CodeSystem"
    VALUE_SET = "ValueSet"
    
    # AI/ML entities
    PREDICTION = "Prediction"
    RECOMMENDATION = "Recommendation"
    RISK_SCORE = "RiskScore"


class RelationType(str, Enum):
    """Types of relationships in the graph"""
    # Clinical relationships
    HAS_CONDITION = "HAS_CONDITION"
    HAS_OBSERVATION = "HAS_OBSERVATION"
    PRESCRIBED = "PRESCRIBED"
    UNDERWENT = "UNDERWENT"
    DIAGNOSED_WITH = "DIAGNOSED_WITH"
    
    # Temporal relationships
    PRECEDED_BY = "PRECEDED_BY"
    CONCURRENT_WITH = "CONCURRENT_WITH"
    CAUSED_BY = "CAUSED_BY"
    
    # Knowledge relationships
    TREATS = "TREATS"
    CONTRAINDICATED_FOR = "CONTRAINDICATED_FOR"
    INTERACTS_WITH = "INTERACTS_WITH"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    ENCODES = "ENCODES"
    REGULATES = "REGULATES"
    
    # Terminology relationships
    MAPPED_TO = "MAPPED_TO"
    SUBCLASS_OF = "SUBCLASS_OF"
    MEMBER_OF = "MEMBER_OF"
    
    # AI relationships
    PREDICTED_BY = "PREDICTED_BY"
    RECOMMENDED_BY = "RECOMMENDED_BY"
    EVIDENCE_FOR = "EVIDENCE_FOR"


class GraphNode(BaseModel):
    """Base class for graph nodes"""
    id: str
    type: NodeType
    properties: Dict[str, Any] = Field(default_factory=dict)
    labels: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True


class GraphRelationship(BaseModel):
    """Base class for graph relationships"""
    id: str
    type: RelationType
    source_id: str
    target_id: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    
    class Config:
        use_enum_values = True


class PatientNode(GraphNode):
    """Patient node in the graph"""
    def __init__(self, patient_id: str, **kwargs):
        super().__init__(
            id=f"patient_{patient_id}",
            type=NodeType.PATIENT,
            **kwargs
        )


class ConditionNode(GraphNode):
    """Condition/diagnosis node"""
    def __init__(self, condition_id: str, patient_id: str, **kwargs):
        properties = kwargs.get("properties", {})
        properties["patient_id"] = patient_id
        
        super().__init__(
            id=f"condition_{condition_id}",
            type=NodeType.CONDITION,
            properties=properties,
            **kwargs
        )


class ObservationNode(GraphNode):
    """Observation/lab result node"""
    def __init__(self, observation_id: str, patient_id: str, **kwargs):
        properties = kwargs.get("properties", {})
        properties["patient_id"] = patient_id
        
        super().__init__(
            id=f"observation_{observation_id}",
            type=NodeType.OBSERVATION,
            properties=properties,
            **kwargs
        )


class MedicationNode(GraphNode):
    """Medication node"""
    def __init__(self, medication_id: str, patient_id: str, **kwargs):
        properties = kwargs.get("properties", {})
        properties["patient_id"] = patient_id
        
        super().__init__(
            id=f"medication_{medication_id}",
            type=NodeType.MEDICATION,
            properties=properties,
            **kwargs
        )


class GuidelineNode(GraphNode):
    """Clinical guideline node"""
    def __init__(self, guideline_id: str, **kwargs):
        super().__init__(
            id=f"guideline_{guideline_id}",
            type=NodeType.GUIDELINE,
            **kwargs
        )


class PredictionNode(GraphNode):
    """ML prediction node"""
    def __init__(self, prediction_id: str, patient_id: str, model_name: str, **kwargs):
        properties = kwargs.get("properties", {})
        properties.update({
            "patient_id": patient_id,
            "model_name": model_name,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        super().__init__(
            id=f"prediction_{prediction_id}",
            type=NodeType.PREDICTION,
            properties=properties,
            **kwargs
        )


class ClinicalGraphSchema:
    """Schema definition for the clinical knowledge graph"""
    
    # Node constraints
    NODE_CONSTRAINTS = {
        NodeType.PATIENT: {
            "unique_properties": ["id"],
            "required_properties": ["id"],
            "indexed_properties": ["id", "mrn"]
        },
        NodeType.CONDITION: {
            "unique_properties": ["id"],
            "required_properties": ["id", "patient_id", "code"],
            "indexed_properties": ["id", "patient_id", "code", "onset_date"]
        },
        NodeType.OBSERVATION: {
            "unique_properties": ["id"],
            "required_properties": ["id", "patient_id", "code"],
            "indexed_properties": ["id", "patient_id", "code", "effective_date"]
        },
        NodeType.MEDICATION: {
            "unique_properties": ["id"],
            "required_properties": ["id", "patient_id", "code"],
            "indexed_properties": ["id", "patient_id", "code", "start_date"]
        },
        NodeType.GUIDELINE: {
            "unique_properties": ["id"],
            "required_properties": ["id", "title", "version"],
            "indexed_properties": ["id", "title", "condition_codes"]
        },
        NodeType.PREDICTION: {
            "unique_properties": ["id"],
            "required_properties": ["id", "patient_id", "model_name", "timestamp"],
            "indexed_properties": ["id", "patient_id", "model_name", "timestamp"]
        }
    }
    
    # Relationship constraints
    RELATIONSHIP_CONSTRAINTS = {
        RelationType.HAS_CONDITION: {
            "source_type": NodeType.PATIENT,
            "target_type": NodeType.CONDITION,
            "cardinality": "one_to_many"
        },
        RelationType.HAS_OBSERVATION: {
            "source_type": NodeType.PATIENT,
            "target_type": NodeType.OBSERVATION,
            "cardinality": "one_to_many"
        },
        RelationType.PRESCRIBED: {
            "source_type": NodeType.PATIENT,
            "target_type": NodeType.MEDICATION,
            "cardinality": "one_to_many"
        },
        RelationType.TREATS: {
            "source_type": NodeType.MEDICATION,
            "target_type": NodeType.CONDITION,
            "cardinality": "many_to_many"
        },
        RelationType.CONTRAINDICATED_FOR: {
            "source_type": NodeType.MEDICATION,
            "target_type": NodeType.CONDITION,
            "cardinality": "many_to_many"
        },
        RelationType.PREDICTED_BY: {
            "source_type": [NodeType.CONDITION, NodeType.RISK_SCORE],
            "target_type": NodeType.PREDICTION,
            "cardinality": "many_to_one"
        }
    }
    
    @classmethod
    def create_indexes(cls, tx):
        """Create Neo4j indexes for performance"""
        queries = []
        
        # Create node indexes
        for node_type, constraints in cls.NODE_CONSTRAINTS.items():
            # Unique constraints
            for prop in constraints.get("unique_properties", []):
                queries.append(
                    f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{node_type.value}) "
                    f"REQUIRE n.{prop} IS UNIQUE"
                )
            
            # Regular indexes
            for prop in constraints.get("indexed_properties", []):
                if prop not in constraints.get("unique_properties", []):
                    queries.append(
                        f"CREATE INDEX IF NOT EXISTS FOR (n:{node_type.value}) "
                        f"ON (n.{prop})"
                    )
        
        # Create composite indexes for common queries
        queries.extend([
            "CREATE INDEX IF NOT EXISTS FOR (n:Condition) ON (n.patient_id, n.onset_date)",
            "CREATE INDEX IF NOT EXISTS FOR (n:Observation) ON (n.patient_id, n.code, n.effective_date)",
            "CREATE INDEX IF NOT EXISTS FOR (n:Medication) ON (n.patient_id, n.status)",
            "CREATE INDEX IF NOT EXISTS FOR (n:Prediction) ON (n.patient_id, n.model_name, n.timestamp)"
        ])
        
        # Execute all queries
        for query in queries:
            tx.run(query)
    
    @classmethod
    def validate_node(cls, node: GraphNode) -> List[str]:
        """Validate a node against schema constraints"""
        errors = []
        
        if node.type in cls.NODE_CONSTRAINTS:
            constraints = cls.NODE_CONSTRAINTS[node.type]
            
            # Check required properties
            for prop in constraints.get("required_properties", []):
                if prop not in node.properties and prop != "id":
                    errors.append(f"Missing required property: {prop}")
        
        return errors
    
    @classmethod
    def validate_relationship(cls, rel: GraphRelationship) -> List[str]:
        """Validate a relationship against schema constraints"""
        errors = []
        
        if rel.type in cls.RELATIONSHIP_CONSTRAINTS:
            constraints = cls.RELATIONSHIP_CONSTRAINTS[rel.type]
            
            # Validate source/target types if specified
            # (Would need actual node type lookup in practice)
        
        return errors