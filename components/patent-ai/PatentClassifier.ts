import * as tf from '@tensorflow/tfjs';
import { PatentNLPEngine } from './PatentNLPEngine';

interface ClassificationResult {
  primaryClass: string;
  confidence: number;
  subClasses: string[];
  technologyArea: string;
  industryApplication: string[];
  complexityLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  ipcClassification?: string;
  cpcClassification?: string;
}

interface TrainingData {
  text: string;
  classification: string;
  subClasses: string[];
  technologyArea: string;
  industryApplication: string[];
}

export class PatentClassifier {
  private model: tf.LayersModel | null = null;
  private vocabulary: Map<string, number> = new Map();
  private classLabels: string[] = [];
  private technologyAreas: string[] = [];
  private nlpEngine: PatentNLPEngine;
  private isInitialized = false;

  // Patent classification categories based on IPC (International Patent Classification)
  private readonly IPC_CLASSES = {
    'A': 'Human Necessities',
    'B': 'Performing Operations; Transporting',
    'C': 'Chemistry; Metallurgy',
    'D': 'Textiles; Paper',
    'E': 'Fixed Constructions',
    'F': 'Mechanical Engineering; Lighting; Heating; Weapons; Blasting',
    'G': 'Physics',
    'H': 'Electricity'
  };

  // Technology areas for modern patent classification
  private readonly TECHNOLOGY_AREAS = [
    'Artificial Intelligence',
    'Machine Learning',
    'Biotechnology',
    'Nanotechnology',
    'Renewable Energy',
    'Medical Devices',
    'Pharmaceuticals',
    'Telecommunications',
    'Computer Hardware',
    'Software',
    'Materials Science',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Automotive',
    'Aerospace',
    'Consumer Electronics',
    'Industrial Automation',
    'Robotics',
    'Internet of Things'
  ];

  // Industry applications
  private readonly INDUSTRY_APPLICATIONS = [
    'Healthcare',
    'Manufacturing',
    'Automotive',
    'Aerospace',
    'Energy',
    'Telecommunications',
    'Consumer Electronics',
    'Agriculture',
    'Construction',
    'Transportation',
    'Defense',
    'Entertainment',
    'Finance',
    'Education',
    'Environmental'
  ];

  constructor() {
    this.nlpEngine = new PatentNLPEngine();
    this.initializeClassifier();
  }

  /**
   * Initialize the patent classifier
   */
  private async initializeClassifier(): Promise<void> {
    try {
      // Try to load pre-trained model
      await this.loadModel();
    } catch (error) {
      console.log('No pre-trained model found, creating new model...');
      await this.createModel();
    }
    
    this.isInitialized = true;
  }

  /**
   * Create a new neural network model for patent classification
   */
  private async createModel(): Promise<void> {
    // Define model architecture
    const model = tf.sequential({
      layers: [
        // Input layer - expects vectorized text features
        tf.layers.dense({
          inputShape: [1000], // Vocabulary size
          units: 512,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        
        // Dropout for regularization
        tf.layers.dropout({ rate: 0.3 }),
        
        // Hidden layers
        tf.layers.dense({
          units: 256,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        
        tf.layers.dropout({ rate: 0.3 }),
        
        tf.layers.dense({
          units: 128,
          activation: 'relu'
        }),
        
        tf.layers.dropout({ rate: 0.2 }),
        
        // Output layer - multi-class classification
        tf.layers.dense({
          units: this.TECHNOLOGY_AREAS.length,
          activation: 'softmax'
        })
      ]
    });

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.model = model;
    
    // Initialize vocabulary and labels
    this.initializeVocabulary();
    this.classLabels = [...this.TECHNOLOGY_AREAS];
    this.technologyAreas = [...this.TECHNOLOGY_AREAS];
  }

  /**
   * Initialize vocabulary for text vectorization
   */
  private initializeVocabulary(): void {
    // Common patent-related terms
    const patentTerms = [
      'method', 'system', 'apparatus', 'device', 'process', 'composition',
      'material', 'structure', 'component', 'element', 'unit', 'module',
      'circuit', 'controller', 'processor', 'sensor', 'detector', 'generator',
      'interface', 'mechanism', 'assembly', 'housing', 'substrate', 'layer',
      'coating', 'film', 'membrane', 'polymer', 'metal', 'ceramic', 'composite',
      'semiconductor', 'crystal', 'optical', 'electrical', 'mechanical',
      'chemical', 'biological', 'digital', 'analog', 'wireless', 'network',
      'communication', 'data', 'signal', 'information', 'control', 'monitoring',
      'measurement', 'analysis', 'detection', 'identification', 'recognition',
      'processing', 'manufacturing', 'production', 'fabrication', 'synthesis',
      'treatment', 'purification', 'separation', 'extraction', 'conversion',
      'energy', 'power', 'battery', 'solar', 'fuel', 'engine', 'motor',
      'transmission', 'storage', 'memory', 'database', 'software', 'algorithm',
      'artificial', 'intelligence', 'machine', 'learning', 'neural', 'network',
      'biotechnology', 'pharmaceutical', 'medical', 'therapeutic', 'diagnostic',
      'nanotechnology', 'microscale', 'nanoscale', 'quantum', 'molecular'
    ];

    patentTerms.forEach((term, index) => {
      this.vocabulary.set(term, index);
    });
  }

  /**
   * Load pre-trained model from storage
   */
  private async loadModel(): Promise<void> {
    try {
      // In a real implementation, this would load from a file or server
      // For now, we'll create a new model each time
      throw new Error('No saved model found');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save the trained model
   */
  async saveModel(): Promise<void> {
    if (!this.model) throw new Error('No model to save');
    
    try {
      // In a real implementation, this would save to IndexedDB or server
      await this.model.save('localstorage://patent-classifier-model');
      console.log('Model saved successfully');
    } catch (error) {
      console.error('Failed to save model:', error);
    }
  }

  /**
   * Classify a patent text
   */
  async classifyPatent(patentText: string): Promise<ClassificationResult> {
    if (!this.isInitialized || !this.model) {
      throw new Error('Classifier not initialized');
    }

    // Preprocess text and extract features
    const features = await this.extractFeatures(patentText);
    
    // Convert to tensor
    const inputTensor = tf.tensor2d([features], [1, features.length]);
    
    // Make prediction
    const prediction = this.model.predict(inputTensor) as tf.Tensor;
    const probabilities = await prediction.data();
    
    // Get top predictions
    const topPredictions = this.getTopPredictions(Array.from(probabilities), 3);
    
    // Analyze text for additional classification
    const nlpResults = await this.nlpEngine.processPatentText(patentText);
    const technologyArea = this.identifyTechnologyArea(patentText, nlpResults);
    const industryApplications = this.identifyIndustryApplications(patentText, nlpResults);
    const complexityLevel = this.assessComplexityLevel(nlpResults);
    const ipcClass = this.suggestIPCClassification(patentText, nlpResults);
    
    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();

    return {
      primaryClass: topPredictions[0].label,
      confidence: topPredictions[0].confidence,
      subClasses: topPredictions.slice(1).map(p => p.label),
      technologyArea,
      industryApplication: industryApplications,
      complexityLevel,
      ipcClassification: ipcClass,
      cpcClassification: this.convertIPCtoCPC(ipcClass)
    };
  }

  /**
   * Extract features from patent text for classification
   */
  private async extractFeatures(text: string): Promise<number[]> {
    // Initialize feature vector
    const features = new Array(1000).fill(0);
    
    // Process text with NLP engine
    const nlpResults = await this.nlpEngine.processPatentText(text);
    
    // Text preprocessing
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Bag of words features
    words.forEach(word => {
      const index = this.vocabulary.get(word);
      if (index !== undefined && index < features.length) {
        features[index] += 1;
      }
    });

    // Normalize bag of words
    const maxCount = Math.max(...features);
    if (maxCount > 0) {
      for (let i = 0; i < features.length; i++) {
        features[i] = features[i] / maxCount;
      }
    }

    // Add technical complexity features
    if (features.length > 500) {
      features[500] = nlpResults.technicalComplexity / 10; // Normalized
      features[501] = nlpResults.technicalConcepts.length / 20; // Normalized
      features[502] = nlpResults.entities.materials.length / 10;
      features[503] = nlpResults.entities.processes.length / 10;
      features[504] = nlpResults.entities.devices.length / 10;
      features[505] = nlpResults.claims.independent.length / 5;
      features[506] = nlpResults.claims.dependent.length / 20;
    }

    return features;
  }

  /**
   * Get top predictions from probability array
   */
  private getTopPredictions(probabilities: number[], topK: number): Array<{ label: string; confidence: number }> {
    const predictions = probabilities.map((prob, index) => ({
      label: this.classLabels[index] || `Class_${index}`,
      confidence: prob
    }));

    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, topK);
  }

  /**
   * Identify technology area based on text analysis
   */
  private identifyTechnologyArea(text: string, nlpResults: any): string {
    const lowerText = text.toLowerCase();
    
    // Technology area keywords
    const areaKeywords = {
      'Artificial Intelligence': ['artificial intelligence', 'ai', 'machine learning', 'neural network', 'deep learning', 'computer vision', 'natural language'],
      'Biotechnology': ['biotech', 'genetic', 'dna', 'protein', 'enzyme', 'biological', 'pharmaceutical', 'therapeutic'],
      'Nanotechnology': ['nano', 'nanoscale', 'nanoparticle', 'nanometer', 'molecular', 'atomic'],
      'Renewable Energy': ['solar', 'wind', 'renewable', 'photovoltaic', 'fuel cell', 'battery', 'energy storage'],
      'Medical Devices': ['medical', 'diagnostic', 'therapeutic', 'surgical', 'implant', 'prosthetic', 'healthcare'],
      'Telecommunications': ['wireless', 'cellular', 'communication', 'network', 'antenna', 'signal', 'transmission'],
      'Semiconductors': ['semiconductor', 'chip', 'transistor', 'integrated circuit', 'microprocessor', 'silicon'],
      'Materials Science': ['material', 'polymer', 'composite', 'ceramic', 'metal', 'alloy', 'coating']
    };

    let bestMatch = 'General Technology';
    let maxScore = 0;

    Object.entries(areaKeywords).forEach(([area, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
        score += matches;
      });
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = area;
      }
    });

    return bestMatch;
  }

  /**
   * Identify industry applications
   */
  private identifyIndustryApplications(text: string, nlpResults: any): string[] {
    const lowerText = text.toLowerCase();
    const applications: string[] = [];

    const industryKeywords = {
      'Healthcare': ['medical', 'health', 'patient', 'clinical', 'hospital', 'therapeutic', 'diagnostic'],
      'Automotive': ['vehicle', 'car', 'automotive', 'engine', 'transmission', 'brake', 'steering'],
      'Aerospace': ['aircraft', 'aerospace', 'aviation', 'satellite', 'rocket', 'space', 'flight'],
      'Manufacturing': ['manufacturing', 'production', 'factory', 'assembly', 'industrial', 'process'],
      'Energy': ['energy', 'power', 'electricity', 'grid', 'generation', 'distribution', 'utility'],
      'Consumer Electronics': ['consumer', 'electronic', 'smartphone', 'computer', 'display', 'audio', 'video'],
      'Agriculture': ['agriculture', 'farming', 'crop', 'soil', 'irrigation', 'fertilizer', 'pesticide'],
      'Construction': ['construction', 'building', 'concrete', 'steel', 'architecture', 'infrastructure'],
      'Environmental': ['environmental', 'pollution', 'waste', 'recycling', 'emission', 'climate', 'green']
    };

    Object.entries(industryKeywords).forEach(([industry, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          score++;
        }
      });
      
      if (score >= 2) { // Threshold for inclusion
        applications.push(industry);
      }
    });

    return applications.length > 0 ? applications : ['General'];
  }

  /**
   * Assess complexity level
   */
  private assessComplexityLevel(nlpResults: any): 'Low' | 'Medium' | 'High' | 'Very High' {
    let complexityScore = 0;

    // Technical concepts
    complexityScore += nlpResults.technicalConcepts.length * 0.1;
    
    // Entity diversity
    const totalEntities = nlpResults.entities.materials.length + 
                         nlpResults.entities.processes.length + 
                         nlpResults.entities.devices.length;
    complexityScore += totalEntities * 0.05;
    
    // Claims complexity
    complexityScore += nlpResults.claims.independent.length * 0.2;
    complexityScore += nlpResults.claims.dependent.length * 0.05;
    
    // Technical complexity from NLP
    complexityScore += nlpResults.technicalComplexity * 0.1;

    if (complexityScore >= 4) return 'Very High';
    if (complexityScore >= 2.5) return 'High';
    if (complexityScore >= 1.5) return 'Medium';
    return 'Low';
  }

  /**
   * Suggest IPC classification
   */
  private suggestIPCClassification(text: string, nlpResults: any): string {
    const lowerText = text.toLowerCase();
    
    // IPC section classification based on keywords
    const ipcKeywords = {
      'A': ['food', 'agriculture', 'medical', 'health', 'sport', 'game', 'entertainment'],
      'B': ['transport', 'separation', 'mixing', 'shaping', 'printing', 'manufacturing'],
      'C': ['chemistry', 'metallurgy', 'cement', 'ceramic', 'glass', 'sugar', 'fermentation'],
      'D': ['textile', 'paper', 'layered', 'flexible', 'non-woven'],
      'E': ['building', 'construction', 'mining', 'drilling', 'foundation'],
      'F': ['engine', 'pump', 'turbine', 'combustion', 'heating', 'cooling', 'lighting'],
      'G': ['instrument', 'measurement', 'optical', 'photography', 'computing', 'calculation'],
      'H': ['electric', 'electronic', 'communication', 'circuit', 'semiconductor', 'antenna']
    };

    let bestSection = 'G'; // Default to Physics
    let maxScore = 0;

    Object.entries(ipcKeywords).forEach(([section, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          score++;
        }
      });
      
      if (score > maxScore) {
        maxScore = score;
        bestSection = section;
      }
    });

    // Generate a more specific classification (simplified)
    const subClass = Math.floor(Math.random() * 99) + 1; // Random for demo
    const group = Math.floor(Math.random() * 999) + 1;
    
    return `${bestSection}${subClass.toString().padStart(2, '0')}${group.toString().padStart(3, '0')}`;
  }

  /**
   * Convert IPC to CPC classification (simplified)
   */
  private convertIPCtoCPC(ipcClass: string): string {
    // CPC is an extension of IPC, so we'll add a CPC-specific suffix
    return `${ipcClass}/00`;
  }

  /**
   * Train the model with new data
   */
  async trainModel(trainingData: TrainingData[]): Promise<void> {
    if (!this.model) {
      await this.createModel();
    }

    if (trainingData.length === 0) {
      console.warn('No training data provided');
      return;
    }

    // Prepare training data
    const features: number[][] = [];
    const labels: number[][] = [];

    for (const data of trainingData) {
      const featureVector = await this.extractFeatures(data.text);
      features.push(featureVector);

      // One-hot encode labels
      const labelVector = new Array(this.TECHNOLOGY_AREAS.length).fill(0);
      const labelIndex = this.TECHNOLOGY_AREAS.indexOf(data.technologyArea);
      if (labelIndex !== -1) {
        labelVector[labelIndex] = 1;
      }
      labels.push(labelVector);
    }

    // Convert to tensors
    const xTrain = tf.tensor2d(features);
    const yTrain = tf.tensor2d(labels);

    // Train the model
    const history = await this.model!.fit(xTrain, yTrain, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss?.toFixed(4)}, accuracy = ${logs?.acc?.toFixed(4)}`);
        }
      }
    });

    // Clean up tensors
    xTrain.dispose();
    yTrain.dispose();

    console.log('Model training completed');
    
    // Save the trained model
    await this.saveModel();
  }

  /**
   * Evaluate model performance
   */
  async evaluateModel(testData: TrainingData[]): Promise<{ accuracy: number; loss: number }> {
    if (!this.model || testData.length === 0) {
      throw new Error('Model not initialized or no test data provided');
    }

    // Prepare test data
    const features: number[][] = [];
    const labels: number[][] = [];

    for (const data of testData) {
      const featureVector = await this.extractFeatures(data.text);
      features.push(featureVector);

      const labelVector = new Array(this.TECHNOLOGY_AREAS.length).fill(0);
      const labelIndex = this.TECHNOLOGY_AREAS.indexOf(data.technologyArea);
      if (labelIndex !== -1) {
        labelVector[labelIndex] = 1;
      }
      labels.push(labelVector);
    }

    // Convert to tensors
    const xTest = tf.tensor2d(features);
    const yTest = tf.tensor2d(labels);

    // Evaluate
    const evaluation = this.model.evaluate(xTest, yTest) as tf.Tensor[];
    const loss = await evaluation[0].data();
    const accuracy = await evaluation[1].data();

    // Clean up tensors
    xTest.dispose();
    yTest.dispose();
    evaluation.forEach(tensor => tensor.dispose());

    return {
      loss: loss[0],
      accuracy: accuracy[0]
    };
  }

  /**
   * Get model summary
   */
  getModelSummary(): string {
    if (!this.model) return 'Model not initialized';
    
    return `Patent Classification Model:
- Architecture: Deep Neural Network
- Input Features: ${this.vocabulary.size} vocabulary terms + technical features
- Hidden Layers: 3 (512, 256, 128 units)
- Output Classes: ${this.TECHNOLOGY_AREAS.length} technology areas
- Regularization: L2 + Dropout
- Optimizer: Adam`;
  }

  /**
   * Get supported technology areas
   */
  getTechnologyAreas(): string[] {
    return [...this.TECHNOLOGY_AREAS];
  }

  /**
   * Get supported industry applications
   */
  getIndustryApplications(): string[] {
    return [...this.INDUSTRY_APPLICATIONS];
  }
}