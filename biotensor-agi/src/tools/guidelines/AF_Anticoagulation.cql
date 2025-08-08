library AF_Anticoagulation version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers

// Code systems
codesystem "SNOMED": 'http://snomed.info/sct'
codesystem "LOINC": 'http://loinc.org'
codesystem "RxNorm": 'http://www.nlm.nih.gov/research/umls/rxnorm'

// Value sets
valueset "Atrial Fibrillation": 'http://biotensor.ai/ValueSet/atrial-fibrillation'
valueset "Anticoagulant Medications": 'http://biotensor.ai/ValueSet/anticoagulants'
valueset "Bleeding Disorders": 'http://biotensor.ai/ValueSet/bleeding-disorders'

// Parameters
parameter "Measurement Period" Interval<DateTime>

// Patient context
context Patient

// Define patient with atrial fibrillation
define "Has Atrial Fibrillation":
  exists([Condition: "Atrial Fibrillation"]) or
  exists([Condition: Code '49436004' from "SNOMED"]) // Atrial fibrillation code

// Calculate age
define "Age":
  AgeInYearsAt(start of "Measurement Period")

// CHA2DS2-VASc components
define "Has Congestive Heart Failure":
  exists([Condition: Code '42343007' from "SNOMED"]) // CHF

define "Has Hypertension":
  exists([Condition: Code '38341003' from "SNOMED"]) // HTN

define "Has Diabetes":
  exists([Condition: Code '73211009' from "SNOMED"]) // DM

define "Has Stroke or TIA":
  exists([Condition: Code '230690007' from "SNOMED"]) or // Stroke
  exists([Condition: Code '266257000' from "SNOMED"]) // TIA

define "Has Vascular Disease":
  exists([Condition: Code '53741008' from "SNOMED"]) or // CAD
  exists([Condition: Code '399957001' from "SNOMED"]) // PAD

define "Is Female":
  Patient.gender = 'female'

// Calculate CHA2DS2-VASc Score
define "CHA2DS2-VASc Score":
  // Age points
  (if "Age" >= 75 then 2
   else if "Age" >= 65 then 1
   else 0) +
  // Clinical conditions
  (if "Has Congestive Heart Failure" then 1 else 0) +
  (if "Has Hypertension" then 1 else 0) +
  (if "Has Diabetes" then 1 else 0) +
  (if "Has Stroke or TIA" then 2 else 0) +
  (if "Has Vascular Disease" then 1 else 0) +
  (if "Is Female" then 1 else 0)

// HAS-BLED components
define "Has Uncontrolled Hypertension":
  exists(
    [Observation: Code '85354-9' from "LOINC"] BP
    where BP.value > 160
  )

define "Has Abnormal Renal Function":
  exists(
    [Observation: Code '2160-0' from "LOINC"] Creatinine
    where Creatinine.value > 2.3
  )

define "Has Abnormal Liver Function":
  exists(
    [Observation: Code '1975-2' from "LOINC"] Bilirubin
    where Bilirubin.value > 2.0
  )

define "Has Bleeding History":
  exists([Condition: "Bleeding Disorders"])

define "Is Elderly":
  "Age" > 65

// Calculate HAS-BLED Score
define "HAS-BLED Score":
  (if "Has Uncontrolled Hypertension" then 1 else 0) +
  (if "Has Abnormal Renal Function" then 1 else 0) +
  (if "Has Abnormal Liver Function" then 1 else 0) +
  (if "Has Stroke or TIA" then 1 else 0) +
  (if "Has Bleeding History" then 1 else 0) +
  (if "Is Elderly" then 1 else 0)
  // Note: Labile INR and Drugs/Alcohol would need additional logic

// Currently on anticoagulation
define "On Anticoagulation":
  exists([MedicationRequest: "Anticoagulant Medications"] MR
    where MR.status = 'active'
  )

// Contraindications
define "Has Absolute Contraindication":
  exists([Condition: Code '74474003' from "SNOMED"]) or // Active bleeding
  exists([Condition: Code '230716006' from "SNOMED"]) // Severe thrombocytopenia

// Main recommendation logic
define "Anticoagulation Recommended":
  "Has Atrial Fibrillation" and
  "CHA2DS2-VASc Score" >= 2 and
  not "Has Absolute Contraindication"

define "Consider Anticoagulation":
  "Has Atrial Fibrillation" and
  "CHA2DS2-VASc Score" = 1 and
  not "Has Absolute Contraindication"

define "Recommendation":
  if "Has Absolute Contraindication" then 'Anticoagulation contraindicated'
  else if "Anticoagulation Recommended" then 'Anticoagulation strongly recommended'
  else if "Consider Anticoagulation" then 'Consider anticoagulation based on shared decision-making'
  else 'Anticoagulation not indicated'

define "Preferred Anticoagulant":
  if "Has Abnormal Renal Function" then 'Consider warfarin or reduced-dose DOAC'
  else if "HAS-BLED Score" >= 3 then 'Use with caution; consider DOAC over warfarin'
  else 'DOAC preferred over warfarin'

// Quality measures
define "In Denominator":
  "Has Atrial Fibrillation" and
  "CHA2DS2-VASc Score" >= 2

define "In Numerator":
  "In Denominator" and
  "On Anticoagulation"

define "Measure Score":
  if "In Denominator" then
    if "In Numerator" then 1 else 0
  else null