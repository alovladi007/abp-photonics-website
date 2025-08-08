"""
Clinical Calculators and Risk Scoring Tools
BioTensor Labs Medical AGI
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import math
from datetime import datetime, date


@dataclass
class CalculatorResult:
    """Result from a clinical calculator"""
    score: float
    interpretation: str
    risk_category: str
    confidence_interval: Optional[Tuple[float, float]] = None
    recommendations: List[str] = None
    evidence_grade: str = "B"  # A, B, C, D
    references: List[str] = None
    
    def __post_init__(self):
        if self.recommendations is None:
            self.recommendations = []
        if self.references is None:
            self.references = []


class CHA2DS2VASc:
    """CHA2DS2-VASc score for stroke risk in atrial fibrillation"""
    
    @staticmethod
    def calculate(
        age: int,
        sex: str,
        congestive_heart_failure: bool,
        hypertension: bool,
        stroke_tia_thromboembolism: bool,
        vascular_disease: bool,
        diabetes: bool
    ) -> CalculatorResult:
        """
        Calculate CHA2DS2-VASc score
        
        C - Congestive heart failure: 1 point
        H - Hypertension: 1 point
        A2 - Age ≥75: 2 points
        D - Diabetes: 1 point
        S2 - Stroke/TIA/thromboembolism: 2 points
        V - Vascular disease: 1 point
        A - Age 65-74: 1 point
        Sc - Sex category (female): 1 point
        """
        score = 0
        
        # Age scoring
        if age >= 75:
            score += 2
        elif age >= 65:
            score += 1
            
        # Clinical conditions
        if congestive_heart_failure:
            score += 1
        if hypertension:
            score += 1
        if stroke_tia_thromboembolism:
            score += 2
        if vascular_disease:
            score += 1
        if diabetes:
            score += 1
            
        # Sex category
        if sex.lower() == "female":
            score += 1
            
        # Risk interpretation
        if score == 0:
            risk_category = "Low"
            annual_stroke_risk = 0.2
            recommendation = "Consider no anticoagulation"
        elif score == 1:
            risk_category = "Low-Moderate"
            annual_stroke_risk = 0.6
            recommendation = "Consider anticoagulation or antiplatelet therapy"
        elif score == 2:
            risk_category = "Moderate"
            annual_stroke_risk = 2.2
            recommendation = "Oral anticoagulation recommended"
        elif score == 3:
            risk_category = "Moderate-High"
            annual_stroke_risk = 3.2
            recommendation = "Oral anticoagulation recommended"
        elif score == 4:
            risk_category = "High"
            annual_stroke_risk = 4.8
            recommendation = "Oral anticoagulation strongly recommended"
        elif score == 5:
            risk_category = "High"
            annual_stroke_risk = 7.2
            recommendation = "Oral anticoagulation strongly recommended"
        elif score == 6:
            risk_category = "Very High"
            annual_stroke_risk = 9.7
            recommendation = "Oral anticoagulation strongly recommended"
        elif score == 7:
            risk_category = "Very High"
            annual_stroke_risk = 11.2
            recommendation = "Oral anticoagulation strongly recommended"
        elif score == 8:
            risk_category = "Very High"
            annual_stroke_risk = 10.8
            recommendation = "Oral anticoagulation strongly recommended"
        else:  # score == 9
            risk_category = "Very High"
            annual_stroke_risk = 12.2
            recommendation = "Oral anticoagulation strongly recommended"
            
        interpretation = f"CHA2DS2-VASc score: {score}. Annual stroke risk: {annual_stroke_risk}%"
        
        recommendations = [recommendation]
        if score >= 2:
            recommendations.append("Consider DOAC over warfarin if no contraindications")
            recommendations.append("Assess bleeding risk with HAS-BLED score")
            
        return CalculatorResult(
            score=score,
            interpretation=interpretation,
            risk_category=risk_category,
            confidence_interval=(annual_stroke_risk * 0.8, annual_stroke_risk * 1.2),
            recommendations=recommendations,
            evidence_grade="A",
            references=[
                "2019 AHA/ACC/HRS Focused Update on Atrial Fibrillation",
                "Lip GY, et al. Chest. 2010;137(2):263-272"
            ]
        )


class HASBLEDScore:
    """HAS-BLED score for bleeding risk assessment"""
    
    @staticmethod
    def calculate(
        hypertension: bool,
        abnormal_renal_function: bool,
        abnormal_liver_function: bool,
        stroke: bool,
        bleeding_history: bool,
        labile_inr: bool,
        elderly: bool,  # >65 years
        drugs_predisposing: bool,
        alcohol_excess: bool
    ) -> CalculatorResult:
        """
        Calculate HAS-BLED score
        
        H - Hypertension (uncontrolled): 1 point
        A - Abnormal renal/liver function: 1 point each (max 2)
        S - Stroke: 1 point
        B - Bleeding history or predisposition: 1 point
        L - Labile INR: 1 point
        E - Elderly (>65): 1 point
        D - Drugs/alcohol: 1 point each (max 2)
        """
        score = 0
        
        if hypertension:
            score += 1
        if abnormal_renal_function:
            score += 1
        if abnormal_liver_function:
            score += 1
        if stroke:
            score += 1
        if bleeding_history:
            score += 1
        if labile_inr:
            score += 1
        if elderly:
            score += 1
        if drugs_predisposing:
            score += 1
        if alcohol_excess:
            score += 1
            
        # Risk interpretation
        if score <= 1:
            risk_category = "Low"
            annual_bleeding_risk = 1.13
        elif score == 2:
            risk_category = "Moderate"
            annual_bleeding_risk = 1.88
        elif score == 3:
            risk_category = "High"
            annual_bleeding_risk = 3.74
        elif score == 4:
            risk_category = "High"
            annual_bleeding_risk = 8.70
        else:  # score >= 5
            risk_category = "Very High"
            annual_bleeding_risk = 12.50
            
        interpretation = f"HAS-BLED score: {score}. Annual major bleeding risk: {annual_bleeding_risk}%"
        
        recommendations = []
        if score >= 3:
            recommendations.append("High bleeding risk - use caution with anticoagulation")
            recommendations.append("Address modifiable risk factors")
            recommendations.append("More frequent monitoring recommended")
        else:
            recommendations.append("Acceptable bleeding risk for anticoagulation")
            
        return CalculatorResult(
            score=score,
            interpretation=interpretation,
            risk_category=risk_category,
            confidence_interval=(annual_bleeding_risk * 0.7, annual_bleeding_risk * 1.3),
            recommendations=recommendations,
            evidence_grade="B",
            references=[
                "Pisters R, et al. Chest. 2010;138(5):1093-1100"
            ]
        )


class HEARTScore:
    """HEART score for chest pain risk stratification"""
    
    @staticmethod
    def calculate(
        history_score: int,  # 0-2
        ecg_score: int,  # 0-2
        age: int,
        risk_factors: int,  # Number of risk factors
        troponin_elevated: bool
    ) -> CalculatorResult:
        """
        Calculate HEART score
        
        H - History: 0-2 points
        E - ECG: 0-2 points
        A - Age: 0-2 points
        R - Risk factors: 0-2 points
        T - Troponin: 0-2 points
        """
        score = 0
        
        # History (provided as parameter)
        score += history_score
        
        # ECG (provided as parameter)
        score += ecg_score
        
        # Age
        if age >= 65:
            score += 2
        elif age >= 45:
            score += 1
            
        # Risk factors (DM, smoking, HTN, hyperlipidemia, family history, obesity)
        if risk_factors >= 3:
            score += 2
        elif risk_factors >= 1:
            score += 1
            
        # Troponin
        if troponin_elevated:
            score += 2
            
        # Risk interpretation
        if score <= 3:
            risk_category = "Low"
            mace_risk = 1.7
            recommendation = "Consider discharge with outpatient follow-up"
        elif score <= 6:
            risk_category = "Moderate"
            mace_risk = 16.6
            recommendation = "Admit for observation and further testing"
        else:  # score >= 7
            risk_category = "High"
            mace_risk = 50.1
            recommendation = "Admit, aggressive management, consider early invasive strategy"
            
        interpretation = f"HEART score: {score}. 6-week MACE risk: {mace_risk}%"
        
        return CalculatorResult(
            score=score,
            interpretation=interpretation,
            risk_category=risk_category,
            confidence_interval=(mace_risk * 0.8, mace_risk * 1.2),
            recommendations=[recommendation],
            evidence_grade="A",
            references=[
                "Six AJ, et al. Heart. 2008;94(9):1153-1157",
                "Mahler SA, et al. Ann Emerg Med. 2017;70(2):166-176"
            ]
        )


class WellsScoreDVT:
    """Wells score for DVT probability"""
    
    @staticmethod
    def calculate(
        active_cancer: bool,
        paralysis_paresis_immobilization: bool,
        bedridden_major_surgery: bool,
        localized_tenderness: bool,
        entire_leg_swollen: bool,
        calf_swelling: bool,
        pitting_edema: bool,
        collateral_veins: bool,
        previous_dvt: bool,
        alternative_diagnosis_likely: bool
    ) -> CalculatorResult:
        """Calculate Wells score for DVT"""
        score = 0
        
        if active_cancer:
            score += 1
        if paralysis_paresis_immobilization:
            score += 1
        if bedridden_major_surgery:
            score += 1
        if localized_tenderness:
            score += 1
        if entire_leg_swollen:
            score += 1
        if calf_swelling:
            score += 1
        if pitting_edema:
            score += 1
        if collateral_veins:
            score += 1
        if previous_dvt:
            score += 1
        if alternative_diagnosis_likely:
            score -= 2
            
        # Risk interpretation
        if score < 0:
            score = 0
            
        if score == 0:
            risk_category = "Low"
            dvt_probability = 5
            recommendation = "D-dimer testing recommended"
        elif score <= 2:
            risk_category = "Moderate"
            dvt_probability = 17
            recommendation = "D-dimer or ultrasound"
        else:  # score >= 3
            risk_category = "High"
            dvt_probability = 53
            recommendation = "Ultrasound recommended"
            
        interpretation = f"Wells score: {score}. DVT probability: {dvt_probability}%"
        
        return CalculatorResult(
            score=score,
            interpretation=interpretation,
            risk_category=risk_category,
            recommendations=[recommendation],
            evidence_grade="A",
            references=[
                "Wells PS, et al. N Engl J Med. 2003;349(13):1227-1235"
            ]
        )


class MELD:
    """MELD score for liver disease severity"""
    
    @staticmethod
    def calculate(
        creatinine: float,  # mg/dL
        bilirubin: float,  # mg/dL
        inr: float,
        dialysis_twice_weekly: bool = False,
        sodium: Optional[float] = None  # mmol/L for MELD-Na
    ) -> CalculatorResult:
        """Calculate MELD score"""
        # Adjust values
        if creatinine < 1.0:
            creatinine = 1.0
        if creatinine > 4.0 or dialysis_twice_weekly:
            creatinine = 4.0
            
        if bilirubin < 1.0:
            bilirubin = 1.0
            
        if inr < 1.0:
            inr = 1.0
            
        # Calculate MELD
        meld = (0.957 * math.log(creatinine) + 
                0.378 * math.log(bilirubin) + 
                1.120 * math.log(inr) + 
                0.643) * 10
        
        meld = round(meld)
        
        # MELD-Na if sodium provided
        if sodium is not None:
            if sodium < 125:
                sodium = 125
            elif sodium > 137:
                sodium = 137
                
            meld_na = meld - (0.025 * meld * (140 - sodium)) + 140
            meld_na = round(meld_na)
            
            if meld_na > meld:
                score = meld_na
                score_type = "MELD-Na"
            else:
                score = meld
                score_type = "MELD"
        else:
            score = meld
            score_type = "MELD"
            
        # Risk interpretation
        if score < 10:
            risk_category = "Low"
            mortality_90d = 1.9
        elif score < 20:
            risk_category = "Moderate"
            mortality_90d = 6.0
        elif score < 30:
            risk_category = "High"
            mortality_90d = 19.6
        else:
            risk_category = "Very High"
            mortality_90d = 52.6
            
        interpretation = f"{score_type} score: {score}. 90-day mortality: {mortality_90d}%"
        
        recommendations = []
        if score >= 15:
            recommendations.append("Consider liver transplant evaluation")
        if score >= 20:
            recommendations.append("High priority for transplantation")
            
        return CalculatorResult(
            score=score,
            interpretation=interpretation,
            risk_category=risk_category,
            recommendations=recommendations,
            evidence_grade="A",
            references=[
                "Kamath PS, et al. Hepatology. 2001;33(2):464-470",
                "Kim WR, et al. Gastroenterology. 2008;135(4):1087-1094"
            ]
        )


class SOFA:
    """SOFA score for organ dysfunction in sepsis"""
    
    @staticmethod
    def calculate(
        pao2_fio2: float,  # PaO2/FiO2 ratio
        platelets: float,  # x10^3/μL
        bilirubin: float,  # mg/dL
        map_or_vasopressors: Dict[str, Any],  # {"map": float, "dopamine": float, etc}
        gcs: int,  # Glasgow Coma Scale
        creatinine: float,  # mg/dL
        urine_output: Optional[float] = None  # mL/day
    ) -> CalculatorResult:
        """Calculate SOFA score"""
        score = 0
        
        # Respiration
        if pao2_fio2 < 100:
            score += 4
        elif pao2_fio2 < 200:
            score += 3
        elif pao2_fio2 < 300:
            score += 2
        elif pao2_fio2 < 400:
            score += 1
            
        # Coagulation
        if platelets < 20:
            score += 4
        elif platelets < 50:
            score += 3
        elif platelets < 100:
            score += 2
        elif platelets < 150:
            score += 1
            
        # Liver
        if bilirubin >= 12.0:
            score += 4
        elif bilirubin >= 6.0:
            score += 3
        elif bilirubin >= 2.0:
            score += 2
        elif bilirubin >= 1.2:
            score += 1
            
        # Cardiovascular
        map = map_or_vasopressors.get("map", 70)
        if map_or_vasopressors.get("epinephrine", 0) > 0.1 or map_or_vasopressors.get("norepinephrine", 0) > 0.1:
            score += 4
        elif map_or_vasopressors.get("epinephrine", 0) > 0 or map_or_vasopressors.get("norepinephrine", 0) > 0:
            score += 3
        elif map_or_vasopressors.get("dopamine", 0) > 5 or map_or_vasopressors.get("dobutamine", 0) > 0:
            score += 2
        elif map < 70:
            score += 1
            
        # CNS
        if gcs < 6:
            score += 4
        elif gcs < 10:
            score += 3
        elif gcs < 13:
            score += 2
        elif gcs < 15:
            score += 1
            
        # Renal
        if creatinine >= 5.0 or (urine_output and urine_output < 200):
            score += 4
        elif creatinine >= 3.5 or (urine_output and urine_output < 500):
            score += 3
        elif creatinine >= 2.0:
            score += 2
        elif creatinine >= 1.2:
            score += 1
            
        # Risk interpretation
        if score <= 6:
            mortality = 10
            risk_category = "Low"
        elif score <= 9:
            mortality = 25
            risk_category = "Moderate"
        elif score <= 12:
            mortality = 50
            risk_category = "High"
        else:
            mortality = 95
            risk_category = "Very High"
            
        interpretation = f"SOFA score: {score}. Predicted mortality: {mortality}%"
        
        recommendations = []
        if score >= 2:
            recommendations.append("Consider ICU admission")
        if score >= 9:
            recommendations.append("High risk - aggressive management indicated")
            
        return CalculatorResult(
            score=score,
            interpretation=interpretation,
            risk_category=risk_category,
            recommendations=recommendations,
            evidence_grade="A",
            references=[
                "Vincent JL, et al. Intensive Care Med. 1996;22(7):707-710"
            ]
        )