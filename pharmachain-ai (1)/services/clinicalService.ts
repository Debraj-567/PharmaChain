import { Medication, DrugInteraction, InteractionSeverity } from '../types';

const COMMON_INTERACTIONS = [
  {
    drugs: ['Amoxicillin', 'Methotrexate'],
    severity: InteractionSeverity.HIGH,
    description: 'Penicillins may reduce the excretion of Methotrexate, increasing toxicity risk.',
    recommendation: 'Monitor for methotrexate toxicity. Consider alternative antibiotic.'
  },
  {
    drugs: ['Atorvastatin', 'Clarithromycin'],
    severity: InteractionSeverity.HIGH,
    description: 'Strong CYP3A4 inhibitors increase exposure to Atorvastatin, raising risk of myopathy/rhabdomyolysis.',
    recommendation: 'Suspend Atorvastatin during Clarithromycin treatment or choose Azithromycin.'
  },
  {
    drugs: ['Warfarin', 'Aspirin'],
    severity: InteractionSeverity.HIGH,
    description: 'Increased risk of bleeding due to antiplatelet effect added to anticoagulant effect.',
    recommendation: 'Monitor INR closely. Assess need for combined therapy.'
  },
  {
    drugs: ['Lisinopril', 'Potassium'],
    severity: InteractionSeverity.MEDIUM,
    description: 'Potential for Hyperkalemia.',
    recommendation: 'Monitor serum potassium levels.'
  },
  {
    drugs: ['Simvastatin', 'Amlodipine'],
    severity: InteractionSeverity.MEDIUM,
    description: 'Increased risk of myopathy when Simvastatin is taken with Amlodipine.',
    recommendation: 'Limit Simvastatin dose to 20mg daily.'
  },
  {
    drugs: ['Amoxicillin', 'Atorvastatin'], 
    severity: InteractionSeverity.LOW,
    description: 'Minor potential for altered metabolism, generally safe but worth noting for sensitive patients.',
    recommendation: 'Monitor for any unusual muscle pain.'
  }
];

export const checkDrugInteractions = async (medications: Medication[]): Promise<DrugInteraction[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const interactions: DrugInteraction[] = [];
  const medNames = medications.map(m => m.name_normalized.toLowerCase());

  COMMON_INTERACTIONS.forEach(rule => {
    // Check if both drugs in the rule are present in the medication list
    // Using includes to handle slight variations (e.g., "Amoxicillin 500mg" vs "Amoxicillin")
    const firstFound = medNames.some(name => name.includes(rule.drugs[0].toLowerCase()));
    const secondFound = medNames.some(name => name.includes(rule.drugs[1].toLowerCase()));
    
    if (firstFound && secondFound) {
      interactions.push({
        pair: rule.drugs,
        severity: rule.severity,
        description: rule.description,
        recommendation: rule.recommendation
      });
    }
  });

  // Special check for Warfarin + NSAIDs (generic class check simulation)
  const hasWarfarin = medNames.some(n => n.includes('warfarin'));
  const hasNSAID = medNames.some(n => n.includes('ibuprofen') || n.includes('naproxen') || n.includes('diclofenac'));
  
  if (hasWarfarin && hasNSAID) {
      interactions.push({
          pair: ['Warfarin', 'NSAIDs'],
          severity: InteractionSeverity.HIGH,
          description: 'NSAIDs can enhance the anticoagulant effect of Warfarin and damage GI mucosa.',
          recommendation: 'Avoid concurrent use. Prefer Acetaminophen/Paracetamol for analgesia.'
      });
  }

  return interactions;
};