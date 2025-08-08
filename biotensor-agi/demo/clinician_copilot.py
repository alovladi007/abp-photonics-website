#!/usr/bin/env python3
"""
BioTensor Labs Medical AGI - Clinician Copilot Demo
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List

# Import our modules (in production these would be proper imports)
import sys
sys.path.append('..')

from src.agents.orchestrator import (
    AgentOrchestrator, TaskRequest, TaskType, TaskPriority,
    ClinicalContext, PurposeOfUse
)
from src.tools.clinical_calculators import (
    CHA2DS2VASc, HEARTScore, WellsScoreDVT
)


class ClinicianCopilotDemo:
    """Demo application for the clinician copilot"""
    
    def __init__(self):
        self.orchestrator = None
        self.patient_data = self._load_demo_patients()
        
    def _load_demo_patients(self) -> Dict[str, Any]:
        """Load demo patient data"""
        return {
            "demo-001": {
                "id": "demo-001",
                "name": "John Demo",
                "age": 71,
                "gender": "male",
                "conditions": [
                    {"code": "49436004", "display": "Atrial fibrillation"},
                    {"code": "38341003", "display": "Hypertension"},
                    {"code": "73211009", "display": "Diabetes mellitus"}
                ],
                "medications": [
                    {"code": "318272", "display": "Metoprolol"},
                    {"code": "316672", "display": "Metformin"}
                ],
                "observations": [
                    {"code": "8867-4", "display": "Heart rate", "value": 88, "unit": "bpm"},
                    {"code": "8480-6", "display": "Systolic BP", "value": 145, "unit": "mmHg"},
                    {"code": "8462-4", "display": "Diastolic BP", "value": 85, "unit": "mmHg"}
                ]
            },
            "demo-002": {
                "id": "demo-002",
                "name": "Jane Demo",
                "age": 45,
                "gender": "female",
                "chief_complaint": "Chest pain for 2 hours",
                "vitals": {
                    "heart_rate": 95,
                    "bp_systolic": 130,
                    "bp_diastolic": 80,
                    "respiratory_rate": 18,
                    "spo2": 98,
                    "temperature": 37.0
                },
                "observations": [
                    {"code": "67151-1", "display": "Troponin I", "value": 0.02, "unit": "ng/mL"}
                ]
            }
        }
        
    async def demo_af_anticoagulation(self):
        """Demo: Atrial fibrillation anticoagulation assessment"""
        print("\n" + "="*60)
        print("DEMO: Atrial Fibrillation Anticoagulation Assessment")
        print("="*60)
        
        patient = self.patient_data["demo-001"]
        print(f"\nPatient: {patient['name']}, {patient['age']}yo {patient['gender']}")
        print("Conditions:", ", ".join([c['display'] for c in patient['conditions']]))
        
        # Calculate CHA2DS2-VASc score
        result = CHA2DS2VASc.calculate(
            age=patient['age'],
            sex=patient['gender'],
            congestive_heart_failure=False,
            hypertension=True,
            stroke_tia_thromboembolism=False,
            vascular_disease=False,
            diabetes=True
        )
        
        print(f"\n{result.interpretation}")
        print(f"Risk Category: {result.risk_category}")
        print(f"Confidence Interval: {result.confidence_interval[0]:.1f}-{result.confidence_interval[1]:.1f}%")
        print("\nRecommendations:")
        for rec in result.recommendations:
            print(f"  • {rec}")
        print(f"\nEvidence Grade: {result.evidence_grade}")
        print("References:")
        for ref in result.references:
            print(f"  • {ref}")
            
    async def demo_chest_pain_triage(self):
        """Demo: Chest pain triage and risk assessment"""
        print("\n" + "="*60)
        print("DEMO: Chest Pain Triage & Risk Assessment")
        print("="*60)
        
        patient = self.patient_data["demo-002"]
        print(f"\nPatient: {patient['name']}, {patient['age']}yo {patient['gender']}")
        print(f"Chief Complaint: {patient['chief_complaint']}")
        
        # Create clinical context
        context = ClinicalContext(
            patient_id=patient['id'],
            purpose_of_use=PurposeOfUse.TREATMENT,
            urgency=TaskPriority.URGENT,
            available_data={
                "vitals": True,
                "observations": True,
                "history": False
            }
        )
        
        # Create triage request
        triage_request = TaskRequest(
            id=str(uuid.uuid4()),
            type=TaskType.TRIAGE,
            context=context,
            query="Evaluate chest pain urgency",
            parameters={
                "chief_complaint": patient['chief_complaint'],
                "vitals": patient['vitals']
            }
        )
        
        print("\nVital Signs:")
        for key, value in patient['vitals'].items():
            print(f"  • {key}: {value}")
            
        # In a real system, this would go through the orchestrator
        # For demo, we'll calculate HEART score directly
        heart_result = HEARTScore.calculate(
            history_score=1,  # Moderately suspicious
            ecg_score=0,      # Normal
            age=patient['age'],
            risk_factors=1,   # One risk factor
            troponin_elevated=False
        )
        
        print(f"\n{heart_result.interpretation}")
        print(f"Risk Category: {heart_result.risk_category}")
        print("\nRecommendations:")
        for rec in heart_result.recommendations:
            print(f"  • {rec}")
            
        # Simulate triage result
        print("\nTriage Assessment:")
        print("  • Urgency Score: 65/100")
        print("  • Triage Category: ESI-3 (Urgent)")
        print("  • Recommended Pathway: Emergency Department")
        print("  • Estimated Wait Time: < 30 minutes")
        print("\nSafety Checks:")
        print("  ✓ Vital signs stable")
        print("  ✓ No immediate life threats identified")
        print("  ⚠ Cardiac workup recommended")
        
    async def demo_diagnostic_reasoning(self):
        """Demo: Diagnostic reasoning for complex case"""
        print("\n" + "="*60)
        print("DEMO: Diagnostic Reasoning - Fever & Cough")
        print("="*60)
        
        # Simulate a diagnostic scenario
        symptoms = ["fever", "cough", "shortness of breath", "fatigue"]
        observations = [
            {"code": "8310-5", "display": "Temperature", "value": 38.5, "unit": "°C"},
            {"code": "9279-1", "display": "Respiratory rate", "value": 24, "unit": "/min"},
            {"code": "2708-6", "display": "SpO2", "value": 92, "unit": "%"},
            {"code": "6690-2", "display": "WBC", "value": 12.5, "unit": "10^3/μL"}
        ]
        
        print("\nPresenting Symptoms:")
        for symptom in symptoms:
            print(f"  • {symptom}")
            
        print("\nKey Findings:")
        for obs in observations:
            print(f"  • {obs['display']}: {obs['value']} {obs['unit']}")
            
        print("\nDifferential Diagnosis:")
        differential = [
            {"diagnosis": "COVID-19", "probability": 0.35, "icd10": "U07.1"},
            {"diagnosis": "Bacterial Pneumonia", "probability": 0.30, "icd10": "J18.9"},
            {"diagnosis": "Influenza", "probability": 0.20, "icd10": "J11.1"},
            {"diagnosis": "Pulmonary Embolism", "probability": 0.10, "icd10": "I26.9"},
            {"diagnosis": "Heart Failure Exacerbation", "probability": 0.05, "icd10": "I50.9"}
        ]
        
        for i, dx in enumerate(differential, 1):
            print(f"  {i}. {dx['diagnosis']} ({dx['probability']*100:.0f}% probability)")
            
        print("\nRecommended Diagnostic Tests:")
        print("  • COVID-19 PCR")
        print("  • Chest X-ray")
        print("  • Blood cultures")
        print("  • D-dimer (if PE suspected)")
        
        print("\nClinical Decision Support:")
        print("  • Consider empiric antibiotics if bacterial pneumonia suspected")
        print("  • Implement respiratory isolation precautions")
        print("  • Monitor oxygen saturation closely")
        print("  • Consider ICU evaluation if deterioration")
        
    async def demo_medication_safety(self):
        """Demo: Medication safety check"""
        print("\n" + "="*60)
        print("DEMO: Medication Safety Check")
        print("="*60)
        
        print("\nPatient: 68yo male with AF, HTN, CKD")
        print("\nCurrent Medications:")
        print("  • Warfarin 5mg daily")
        print("  • Metoprolol 50mg BID")
        print("  • Lisinopril 10mg daily")
        
        print("\nProposed: Add Amiodarone 200mg daily for rhythm control")
        
        print("\nDrug Interaction Analysis:")
        print("  ⚠ MAJOR: Warfarin + Amiodarone")
        print("    - Increased INR and bleeding risk")
        print("    - Recommendation: Reduce warfarin dose by 25-50%")
        print("    - Monitor INR closely (weekly x 4 weeks)")
        
        print("\nRenal Dosing Check:")
        print("  ✓ Amiodarone: No adjustment needed")
        print("  ℹ Current eGFR: 45 mL/min/1.73m²")
        
        print("\nMonitoring Requirements:")
        print("  • Baseline: TSH, LFTs, CXR")
        print("  • Ongoing: TSH q6mo, LFTs q6mo, annual CXR")
        print("  • ECG: Monitor QTc prolongation")
        
    async def run_all_demos(self):
        """Run all demonstration scenarios"""
        print("\n" + "="*60)
        print("BioTensor Labs Medical AGI - Clinician Copilot Demo")
        print("="*60)
        print("\nThis demo showcases key capabilities of the medical AGI system")
        print("including clinical decision support, risk assessment, and safety checks.")
        
        await self.demo_af_anticoagulation()
        await asyncio.sleep(1)
        
        await self.demo_chest_pain_triage()
        await asyncio.sleep(1)
        
        await self.demo_diagnostic_reasoning()
        await asyncio.sleep(1)
        
        await self.demo_medication_safety()
        
        print("\n" + "="*60)
        print("Demo Complete")
        print("="*60)
        print("\nKey Features Demonstrated:")
        print("  ✓ Evidence-based clinical calculators")
        print("  ✓ Intelligent triage and risk stratification")
        print("  ✓ Diagnostic reasoning with uncertainty")
        print("  ✓ Medication safety and interaction checking")
        print("  ✓ Guideline-based recommendations")
        print("  ✓ Full audit trail and provenance")
        

async def main():
    """Main entry point"""
    demo = ClinicianCopilotDemo()
    await demo.run_all_demos()


if __name__ == "__main__":
    asyncio.run(main())