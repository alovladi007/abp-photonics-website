import { create } from 'zustand';
import { PatentNLPEngine } from '../components/patent-ai/PatentNLPEngine';
import { PatentClassifier } from '../components/patent-ai/PatentClassifier';
import { PriorArtSearch } from '../components/patent-ai/PriorArtSearch';
import { PatentSimilarityEngine } from '../components/patent-ai/PatentSimilarityEngine';

interface AnalysisResult {
  id: string;
  timestamp: string;
  patentText: string;
  classification: {
    primaryClass: string;
    confidence: number;
    subClasses: string[];
    technologyArea: string;
    industryApplication: string[];
    complexityLevel: string;
    ipcClassification?: string;
    cpcClassification?: string;
  };
  noveltyScore: number;
  priorArt: Array<{
    title: string;
    similarity: number;
    patentNumber: string;
    abstract: string;
  }>;
  technicalConcepts: string[];
  claims: {
    independent: string[];
    dependent: string[];
  };
  patentability: {
    score: number;
    factors: string[];
    recommendations: string[];
  };
  nlpResults: {
    entities: {
      materials: string[];
      processes: string[];
      devices: string[];
      measurements: string[];
    };
    keyPhrases: string[];
    abstractSummary: string;
    technicalComplexity: number;
    readabilityScore: number;
  };
}

interface PatentDocument {
  id: string;
  title: string;
  abstract: string;
  claims: string[];
  inventors: string[];
  assignee: string;
  patentNumber: string;
  applicationNumber: string;
  filingDate: string;
  publicationDate: string;
  grantDate?: string;
  ipcClassification: string[];
  cpcClassification: string[];
  technicalField: string;
  backgroundArt: string;
}

interface PatentStoreState {
  // AI Engine instances
  nlpEngine: PatentNLPEngine | null;
  classifier: PatentClassifier | null;
  priorArtSearch: PriorArtSearch | null;
  similarityEngine: PatentSimilarityEngine | null;

  // State
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Analysis data
  currentAnalysis: AnalysisResult | null;
  analysisHistory: AnalysisResult[];
  savedPatents: PatentDocument[];

  // UI state
  activeTab: 'analyze' | 'search' | 'compare' | 'history';
  searchQuery: string;
  searchResults: any[];
  selectedPatents: string[];

  // Actions
  initializeModels: () => Promise<void>;
  analyzePatent: (patentText: string, options?: any) => Promise<AnalysisResult>;
  searchPatents: (query: string, options?: any) => Promise<any[]>;
  comparePatents: (patentIds: string[]) => Promise<any>;
  saveAnalysis: (analysis: AnalysisResult) => void;
  loadAnalysisHistory: () => void;
  clearHistory: () => void;
  setActiveTab: (tab: 'analyze' | 'search' | 'compare' | 'history') => void;
  setSearchQuery: (query: string) => void;
  addSelectedPatent: (patentId: string) => void;
  removeSelectedPatent: (patentId: string) => void;
  clearSelectedPatents: () => void;
  setError: (error: string | null) => void;
}

export const usePatentStore = create<PatentStoreState>((set, get) => ({
  // Initial state
  nlpEngine: null,
  classifier: null,
  priorArtSearch: null,
  similarityEngine: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  currentAnalysis: null,
  analysisHistory: [],
  savedPatents: [],
  activeTab: 'analyze',
  searchQuery: '',
  searchResults: [],
  selectedPatents: [],

  // Initialize AI models
  initializeModels: async () => {
    set({ isLoading: true, error: null });

    try {
      console.log('Initializing patent analysis AI models...');

      // Initialize AI engines
      const nlpEngine = new PatentNLPEngine();
      const classifier = new PatentClassifier();
      const priorArtSearch = new PriorArtSearch();
      const similarityEngine = new PatentSimilarityEngine();

      // Wait for all engines to initialize
      await Promise.all([
        // NLP engine initializes automatically in constructor
        new Promise(resolve => setTimeout(resolve, 1000)), // Simulated delay
        // Classifier initializes automatically
        new Promise(resolve => setTimeout(resolve, 1500)),
        // Prior art search initializes automatically
        new Promise(resolve => setTimeout(resolve, 1200)),
        // Similarity engine initializes automatically
        new Promise(resolve => setTimeout(resolve, 800))
      ]);

      set({
        nlpEngine,
        classifier,
        priorArtSearch,
        similarityEngine,
        isInitialized: true,
        isLoading: false
      });

      console.log('Patent analysis AI models initialized successfully');

      // Load analysis history from localStorage
      get().loadAnalysisHistory();

    } catch (error) {
      console.error('Failed to initialize patent analysis models:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize AI models',
        isLoading: false
      });
    }
  },

  // Analyze patent text
  analyzePatent: async (patentText: string, options = {}) => {
    const { nlpEngine, classifier, priorArtSearch, similarityEngine } = get();

    if (!nlpEngine || !classifier || !priorArtSearch || !similarityEngine) {
      throw new Error('AI models not initialized');
    }

    set({ isLoading: true, error: null });

    try {
      console.log('Starting patent analysis...');

      // Step 1: NLP Processing
      console.log('Processing with NLP engine...');
      const nlpResults = await nlpEngine.processPatentText(patentText);

      // Step 2: Patent Classification
      console.log('Classifying patent...');
      const classification = await classifier.classifyPatent(patentText);

      // Step 3: Prior Art Search
      console.log('Searching for prior art...');
      const priorArt = await priorArtSearch.findSimilarPatents(patentText, {
        limit: 10,
        threshold: 0.6,
        ...options
      });

      // Step 4: Similarity Analysis
      console.log('Calculating similarity scores...');
      const similarityScores = await similarityEngine.calculateSimilarity(
        patentText,
        priorArt.map(p => p.patent.abstract)
      );

      // Step 5: Calculate novelty score
      const noveltyScore = get().calculateNoveltyScore(similarityScores as number[], priorArt);

      // Step 6: Assess patentability
      const patentability = get().assessPatentability(nlpResults, classification, noveltyScore);

      // Create analysis result
      const analysisResult: AnalysisResult = {
        id: `analysis_${Date.now()}`,
        timestamp: new Date().toISOString(),
        patentText,
        classification: {
          primaryClass: classification.primaryClass,
          confidence: classification.confidence,
          subClasses: classification.subClasses,
          technologyArea: classification.technologyArea,
          industryApplication: classification.industryApplication,
          complexityLevel: classification.complexityLevel,
          ipcClassification: classification.ipcClassification,
          cpcClassification: classification.cpcClassification
        },
        noveltyScore,
        priorArt: priorArt.map((art, index) => ({
          title: art.patent.title,
          similarity: Array.isArray(similarityScores) ? similarityScores[index] : 0,
          patentNumber: art.patent.patentNumber,
          abstract: art.patent.abstract
        })),
        technicalConcepts: nlpResults.technicalConcepts,
        claims: nlpResults.claims,
        patentability,
        nlpResults: {
          entities: nlpResults.entities,
          keyPhrases: nlpResults.keyPhrases,
          abstractSummary: nlpResults.abstractSummary,
          technicalComplexity: nlpResults.technicalComplexity,
          readabilityScore: nlpResults.readabilityScore
        }
      };

      set({
        currentAnalysis: analysisResult,
        isLoading: false
      });

      console.log('Patent analysis completed successfully');
      return analysisResult;

    } catch (error) {
      console.error('Patent analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Search patents
  searchPatents: async (query: string, options = {}) => {
    const { priorArtSearch } = get();

    if (!priorArtSearch) {
      throw new Error('Prior art search not initialized');
    }

    set({ isLoading: true, error: null });

    try {
      const results = await priorArtSearch.findSimilarPatents(query, {
        limit: 20,
        threshold: 0.3,
        ...options
      });

      set({
        searchResults: results,
        searchQuery: query,
        isLoading: false
      });

      return results;

    } catch (error) {
      console.error('Patent search failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Compare patents
  comparePatents: async (patentIds: string[]) => {
    const { priorArtSearch, similarityEngine } = get();

    if (!priorArtSearch || !similarityEngine) {
      throw new Error('AI models not initialized');
    }

    if (patentIds.length < 2) {
      throw new Error('At least 2 patents required for comparison');
    }

    set({ isLoading: true, error: null });

    try {
      // Get patent details
      const patents = await Promise.all(
        patentIds.map(id => priorArtSearch.getPatentDetails(id))
      );

      const validPatents = patents.filter(p => p !== null);

      if (validPatents.length < 2) {
        throw new Error('Could not find enough patents for comparison');
      }

      // Calculate pairwise similarities
      const comparisons = [];
      for (let i = 0; i < validPatents.length; i++) {
        for (let j = i + 1; j < validPatents.length; j++) {
          const patent1 = validPatents[i]!;
          const patent2 = validPatents[j]!;

          const similarity = await similarityEngine.calculateDetailedSimilarity(
            `${patent1.title} ${patent1.abstract}`,
            `${patent2.title} ${patent2.abstract}`
          );

          comparisons.push({
            patent1: {
              id: patent1.id,
              title: patent1.title,
              patentNumber: patent1.patentNumber
            },
            patent2: {
              id: patent2.id,
              title: patent2.title,
              patentNumber: patent2.patentNumber
            },
            similarity
          });
        }
      }

      const comparisonResult = {
        patents: validPatents,
        comparisons,
        timestamp: new Date().toISOString()
      };

      set({ isLoading: false });
      return comparisonResult;

    } catch (error) {
      console.error('Patent comparison failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Comparison failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Save analysis to history
  saveAnalysis: (analysis: AnalysisResult) => {
    const { analysisHistory } = get();
    const updatedHistory = [analysis, ...analysisHistory].slice(0, 50); // Keep last 50 analyses

    set({ analysisHistory: updatedHistory });

    // Save to localStorage
    try {
      localStorage.setItem('patent_analysis_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save analysis to localStorage:', error);
    }
  },

  // Load analysis history from localStorage
  loadAnalysisHistory: () => {
    try {
      const saved = localStorage.getItem('patent_analysis_history');
      if (saved) {
        const history = JSON.parse(saved);
        set({ analysisHistory: history });
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  },

  // Clear analysis history
  clearHistory: () => {
    set({ analysisHistory: [] });
    try {
      localStorage.removeItem('patent_analysis_history');
    } catch (error) {
      console.error('Failed to clear analysis history:', error);
    }
  },

  // UI state setters
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  addSelectedPatent: (patentId) => {
    const { selectedPatents } = get();
    if (!selectedPatents.includes(patentId)) {
      set({ selectedPatents: [...selectedPatents, patentId] });
    }
  },
  removeSelectedPatent: (patentId) => {
    const { selectedPatents } = get();
    set({ selectedPatents: selectedPatents.filter(id => id !== patentId) });
  },
  clearSelectedPatents: () => set({ selectedPatents: [] }),
  setError: (error) => set({ error }),

  // Helper functions (defined within the store)
  calculateNoveltyScore: (similarities: number[], priorArt: any[]): number => {
    if (similarities.length === 0) return 0.9;

    const maxSimilarity = Math.max(...similarities);
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

    // Higher similarity to existing patents = lower novelty
    const noveltyScore = Math.max(0, 1 - (maxSimilarity * 0.7 + avgSimilarity * 0.3));
    return Math.round(noveltyScore * 100) / 100;
  },

  assessPatentability: (nlpResults: any, classification: any, noveltyScore: number) => {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let score = 0.5; // Base score

    // Novelty factor
    if (noveltyScore > 0.8) {
      score += 0.3;
      factors.push('High novelty score');
    } else if (noveltyScore > 0.6) {
      score += 0.1;
      factors.push('Moderate novelty');
    } else {
      score -= 0.2;
      factors.push('Low novelty - similar prior art exists');
      recommendations.push('Consider focusing on unique aspects to differentiate from prior art');
    }

    // Technical complexity
    if (nlpResults.technicalConcepts.length > 10) {
      score += 0.1;
      factors.push('High technical complexity');
    }

    // Claims quality
    if (nlpResults.claims.independent.length > 0) {
      score += 0.1;
      factors.push('Well-structured claims');
    } else {
      recommendations.push('Add clear independent claims to strengthen patent application');
    }

    // Classification confidence
    if (classification.confidence > 0.8) {
      score += 0.05;
      factors.push('Clear technical classification');
    }

    return {
      score: Math.min(1, Math.max(0, score)),
      factors,
      recommendations
    };
  }
}));