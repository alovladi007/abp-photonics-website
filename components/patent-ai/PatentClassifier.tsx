import { natural } from 'natural';

interface PatentData {
  id: string;
  title: string;
  abstract: string;
  claims: string[];
  description: string;
  inventors: string[];
  assignee: string;
  filingDate: string;
  publicationDate: string;
  classification: string[];
  technicalTerms: string[];
  noveltyScore: number;
  priorArtSimilarity: number;
  claimStrength: number;
}

export class PatentClassifier {
  private static tfidf = new natural.TfIdf();
  private static classifier = new natural.BayesClassifier();

  // Patent classification categories
  private static categories = {
    'Software & Computing': [
      'algorithm', 'software', 'application', 'system', 'method', 'process',
      'data', 'database', 'network', 'interface', 'user', 'device', 'computer',
      'program', 'code', 'function', 'module', 'component', 'service', 'api',
      'framework', 'architecture', 'protocol', 'encryption', 'authentication',
      'artificial intelligence', 'machine learning', 'neural network', 'blockchain'
    ],
    'Hardware & Electronics': [
      'circuit', 'processor', 'memory', 'sensor', 'actuator', 'controller',
      'device', 'component', 'assembly', 'mechanism', 'apparatus', 'system',
      'hardware', 'electronic', 'electrical', 'mechanical', 'physical',
      'integrated', 'semiconductor', 'microcontroller', 'microprocessor',
      'transistor', 'capacitor', 'resistor', 'inductor', 'oscillator'
    ],
    'Biotechnology & Life Sciences': [
      'protein', 'gene', 'dna', 'rna', 'cell', 'tissue', 'organism',
      'enzyme', 'antibody', 'vaccine', 'drug', 'compound', 'molecule',
      'biological', 'biochemical', 'pharmaceutical', 'therapeutic',
      'diagnostic', 'treatment', 'disease', 'pathogen', 'bacteria',
      'genetic', 'mutation', 'expression', 'receptor', 'ligand'
    ],
    'Chemistry & Materials': [
      'chemical', 'compound', 'molecule', 'reaction', 'catalyst', 'solvent',
      'polymer', 'material', 'substance', 'composition', 'formula', 'synthesis',
      'organic', 'inorganic', 'analytical', 'chromatography', 'spectroscopy',
      'crystallization', 'purification', 'extraction', 'separation',
      'nanoparticle', 'composite', 'alloy', 'ceramic', 'plastic'
    ],
    'Mechanical Engineering': [
      'mechanism', 'assembly', 'component', 'part', 'structure', 'system',
      'machine', 'apparatus', 'device', 'equipment', 'tool', 'instrument',
      'mechanical', 'physical', 'structural', 'kinematic', 'dynamic',
      'force', 'motion', 'energy', 'power', 'transmission', 'gear',
      'bearing', 'shaft', 'pump', 'valve', 'motor', 'engine'
    ],
    'Telecommunications': [
      'communication', 'signal', 'transmission', 'receiver', 'transmitter',
      'antenna', 'modulation', 'demodulation', 'frequency', 'wavelength',
      'wireless', 'cellular', 'satellite', 'fiber', 'optical', 'radio',
      'telephone', 'network', 'protocol', 'routing', 'switching'
    ],
    'Energy & Power': [
      'energy', 'power', 'battery', 'fuel', 'solar', 'wind', 'nuclear',
      'generator', 'turbine', 'reactor', 'converter', 'inverter', 'storage',
      'electric', 'magnetic', 'electromagnetic', 'photovoltaic', 'thermal',
      'combustion', 'efficiency', 'renewable', 'sustainable'
    ],
    'Transportation & Automotive': [
      'vehicle', 'automobile', 'car', 'truck', 'engine', 'transmission',
      'brake', 'suspension', 'steering', 'wheel', 'tire', 'fuel',
      'exhaust', 'emission', 'safety', 'airbag', 'seatbelt', 'navigation',
      'autonomous', 'driverless', 'electric vehicle', 'hybrid'
    ]
  };

  static async classifyPatent(patent: PatentData): Promise<string[]> {
    const text = `${patent.title} ${patent.abstract} ${patent.description}`.toLowerCase();
    const classifications: string[] = [];
    const scores: { [category: string]: number } = {};

    // Calculate similarity scores for each category
    Object.entries(this.categories).forEach(([category, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length;
        }
      });
      scores[category] = score;
    });

    // Normalize scores and select top categories
    const maxScore = Math.max(...Object.values(scores));
    Object.entries(scores).forEach(([category, score]) => {
      const normalizedScore = score / maxScore;
      if (normalizedScore > 0.3) { // Threshold for classification
        classifications.push(category);
      }
    });

    // If no clear classification, use title-based classification
    if (classifications.length === 0) {
      const titleClassification = this.classifyByTitle(patent.title);
      if (titleClassification) {
        classifications.push(titleClassification);
      }
    }

    // Add IPC classification if available
    const ipcClassification = this.extractIPCClassification(patent.description);
    if (ipcClassification) {
      classifications.push(`IPC: ${ipcClassification}`);
    }

    return classifications.length > 0 ? classifications : ['Unclassified'];
  }

  private static classifyByTitle(title: string): string | null {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('software') || titleLower.includes('algorithm') || titleLower.includes('system')) {
      return 'Software & Computing';
    }
    if (titleLower.includes('circuit') || titleLower.includes('electronic') || titleLower.includes('processor')) {
      return 'Hardware & Electronics';
    }
    if (titleLower.includes('protein') || titleLower.includes('gene') || titleLower.includes('biological')) {
      return 'Biotechnology & Life Sciences';
    }
    if (titleLower.includes('chemical') || titleLower.includes('compound') || titleLower.includes('material')) {
      return 'Chemistry & Materials';
    }
    if (titleLower.includes('mechanism') || titleLower.includes('mechanical') || titleLower.includes('assembly')) {
      return 'Mechanical Engineering';
    }
    if (titleLower.includes('communication') || titleLower.includes('signal') || titleLower.includes('wireless')) {
      return 'Telecommunications';
    }
    if (titleLower.includes('energy') || titleLower.includes('power') || titleLower.includes('battery')) {
      return 'Energy & Power';
    }
    if (titleLower.includes('vehicle') || titleLower.includes('automotive') || titleLower.includes('car')) {
      return 'Transportation & Automotive';
    }

    return null;
  }

  private static extractIPCClassification(text: string): string | null {
    // Extract International Patent Classification codes
    const ipcPattern = /[A-H]\d{2}[A-Z]\s*\d{1,2}\/\d{2,4}/g;
    const matches = text.match(ipcPattern);
    return matches ? matches[0] : null;
  }

  static async getClassificationConfidence(patent: PatentData, category: string): Promise<number> {
    const text = `${patent.title} ${patent.abstract} ${patent.description}`.toLowerCase();
    const keywords = this.categories[category as keyof typeof this.categories] || [];
    
    let totalMatches = 0;
    let totalKeywords = keywords.length;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      if (matches) {
        totalMatches += matches.length;
      }
    });
    
    return Math.min(totalMatches / totalKeywords, 1);
  }

  static async getSubClassification(patent: PatentData): Promise<string[]> {
    const subClassifications: string[] = [];
    const text = `${patent.title} ${patent.abstract} ${patent.description}`.toLowerCase();
    
    // Software sub-classifications
    if (text.includes('artificial intelligence') || text.includes('machine learning')) {
      subClassifications.push('Artificial Intelligence');
    }
    if (text.includes('blockchain') || text.includes('cryptocurrency')) {
      subClassifications.push('Blockchain Technology');
    }
    if (text.includes('cybersecurity') || text.includes('security')) {
      subClassifications.push('Cybersecurity');
    }
    
    // Hardware sub-classifications
    if (text.includes('sensor') || text.includes('detector')) {
      subClassifications.push('Sensor Technology');
    }
    if (text.includes('semiconductor') || text.includes('integrated circuit')) {
      subClassifications.push('Semiconductor Technology');
    }
    
    // Biotechnology sub-classifications
    if (text.includes('gene therapy') || text.includes('genetic')) {
      subClassifications.push('Gene Therapy');
    }
    if (text.includes('drug delivery') || text.includes('pharmaceutical')) {
      subClassifications.push('Drug Delivery');
    }
    
    return subClassifications;
  }
}