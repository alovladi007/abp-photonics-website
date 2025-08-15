import axios from 'axios';
import * as Fuse from 'fuse.js';
import { PatentNLPEngine } from './PatentNLPEngine';
import { PatentSimilarityEngine } from './PatentSimilarityEngine';

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
  fullText?: string;
}

interface SearchOptions {
  limit?: number;
  threshold?: number;
  searchFields?: string[];
  includeExpired?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  jurisdictions?: string[];
  technologyAreas?: string[];
}

interface SearchResult {
  patent: PatentDocument;
  similarity: number;
  matchedFields: string[];
  relevanceScore: number;
  priorArtRelevance: 'High' | 'Medium' | 'Low';
}

export class PriorArtSearch {
  private nlpEngine: PatentNLPEngine;
  private similarityEngine: PatentSimilarityEngine;
  private patentDatabase: PatentDocument[] = [];
  private searchIndex: Fuse<PatentDocument>;
  private isInitialized = false;

  // Patent databases and APIs
  private readonly PATENT_APIS = {
    USPTO: 'https://developer.uspto.gov/api/v1',
    EPO: 'https://ops.epo.org/3.2',
    GOOGLE_PATENTS: 'https://patents.googleapis.com/v1',
    WIPO: 'https://www.wipo.int/branddb/en/api'
  };

  constructor() {
    this.nlpEngine = new PatentNLPEngine();
    this.similarityEngine = new PatentSimilarityEngine();
    this.initializeSearch();
  }

  /**
   * Initialize the prior art search system
   */
  private async initializeSearch(): Promise<void> {
    try {
      // Initialize search index
      this.searchIndex = new Fuse(this.patentDatabase, {
        keys: [
          { name: 'title', weight: 0.3 },
          { name: 'abstract', weight: 0.4 },
          { name: 'technicalField', weight: 0.2 },
          { name: 'claims', weight: 0.1 }
        ],
        threshold: 0.3,
        includeScore: true,
        includeMatches: true
      });

      // Load sample patent data (in a real implementation, this would load from a database)
      await this.loadSamplePatentData();
      
      this.isInitialized = true;
      console.log('Prior art search system initialized');
    } catch (error) {
      console.error('Failed to initialize prior art search:', error);
    }
  }

  /**
   * Load sample patent data for demonstration
   */
  private async loadSamplePatentData(): Promise<void> {
    // Sample patent data - in a real implementation, this would come from patent databases
    const samplePatents: PatentDocument[] = [
      {
        id: '1',
        title: 'Machine Learning System for Medical Diagnosis',
        abstract: 'A machine learning system that uses neural networks to analyze medical images and provide diagnostic recommendations. The system processes medical scans using convolutional neural networks and provides probability scores for various conditions.',
        claims: [
          'A method for medical diagnosis comprising: receiving medical image data; processing the image data using a trained neural network; generating diagnostic predictions with confidence scores.',
          'The method of claim 1, wherein the neural network is a convolutional neural network trained on a dataset of medical images.'
        ],
        inventors: ['John Smith', 'Jane Doe'],
        assignee: 'MedTech Solutions Inc.',
        patentNumber: 'US10123456',
        applicationNumber: 'US16/123456',
        filingDate: '2020-01-15',
        publicationDate: '2021-07-15',
        grantDate: '2022-01-15',
        ipcClassification: ['G06N3/02', 'A61B5/00'],
        cpcClassification: ['G06N3/02', 'A61B5/0033'],
        technicalField: 'Medical AI and Machine Learning',
        backgroundArt: 'Traditional medical diagnosis relies on manual interpretation of medical images by trained radiologists. This process is time-consuming and subject to human error.'
      },
      {
        id: '2',
        title: 'Solar Cell with Enhanced Efficiency',
        abstract: 'A photovoltaic solar cell with improved efficiency through the use of perovskite materials and anti-reflective coatings. The cell achieves over 25% efficiency in laboratory conditions.',
        claims: [
          'A solar cell comprising: a substrate; a perovskite active layer; an anti-reflective coating; electrical contacts for current collection.',
          'The solar cell of claim 1, wherein the perovskite layer comprises methylammonium lead iodide.'
        ],
        inventors: ['Alice Johnson', 'Bob Wilson'],
        assignee: 'SolarTech Innovations',
        patentNumber: 'US10234567',
        applicationNumber: 'US16/234567',
        filingDate: '2019-06-20',
        publicationDate: '2020-12-20',
        grantDate: '2021-06-20',
        ipcClassification: ['H01L31/04', 'H01L31/18'],
        cpcClassification: ['H01L31/042', 'H01L31/1844'],
        technicalField: 'Renewable Energy and Photovoltaics',
        backgroundArt: 'Traditional silicon solar cells have reached efficiency limits. New materials like perovskites offer potential for higher efficiency solar cells.'
      },
      {
        id: '3',
        title: 'Autonomous Vehicle Navigation System',
        abstract: 'An autonomous vehicle navigation system that combines LiDAR, camera sensors, and GPS data to enable safe self-driving capabilities. The system uses real-time sensor fusion and machine learning algorithms.',
        claims: [
          'An autonomous vehicle navigation system comprising: LiDAR sensors; camera sensors; GPS receiver; processing unit for sensor fusion and path planning.',
          'The system of claim 1, wherein the processing unit executes machine learning algorithms for object detection and classification.'
        ],
        inventors: ['Charlie Brown', 'Diana Prince'],
        assignee: 'AutoDrive Technologies',
        patentNumber: 'US10345678',
        applicationNumber: 'US16/345678',
        filingDate: '2021-03-10',
        publicationDate: '2022-09-10',
        ipcClassification: ['G05D1/02', 'G01S17/93'],
        cpcClassification: ['G05D1/0276', 'G01S17/931'],
        technicalField: 'Autonomous Vehicles and Robotics',
        backgroundArt: 'Current vehicle navigation systems require human intervention. Fully autonomous systems need to integrate multiple sensors and make real-time decisions.'
      },
      {
        id: '4',
        title: 'Blockchain-Based Supply Chain Management',
        abstract: 'A supply chain management system using blockchain technology to track products from manufacture to delivery. The system provides immutable records and enhances transparency.',
        claims: [
          'A supply chain management system comprising: blockchain network; smart contracts for transaction recording; user interfaces for stakeholders.',
          'The system of claim 1, wherein smart contracts automatically execute when predefined conditions are met.'
        ],
        inventors: ['Eve Adams', 'Frank Miller'],
        assignee: 'ChainLogistics Corp.',
        patentNumber: 'US10456789',
        applicationNumber: 'US16/456789',
        filingDate: '2020-11-05',
        publicationDate: '2022-05-05',
        ipcClassification: ['G06Q10/08', 'H04L9/06'],
        cpcClassification: ['G06Q10/087', 'H04L9/0643'],
        technicalField: 'Blockchain and Supply Chain',
        backgroundArt: 'Traditional supply chain management lacks transparency and is prone to fraud. Blockchain technology can provide immutable tracking records.'
      },
      {
        id: '5',
        title: 'Quantum Computing Error Correction',
        abstract: 'A quantum error correction system that uses surface codes to protect quantum information from decoherence and operational errors. The system enables fault-tolerant quantum computation.',
        claims: [
          'A quantum error correction system comprising: quantum processor with surface code implementation; classical controller for error syndrome detection; error correction algorithms.',
          'The system of claim 1, wherein the surface code uses a two-dimensional lattice of qubits with nearest-neighbor interactions.'
        ],
        inventors: ['Grace Hopper', 'Isaac Newton'],
        assignee: 'QuantumTech Solutions',
        patentNumber: 'US10567890',
        applicationNumber: 'US16/567890',
        filingDate: '2021-08-15',
        publicationDate: '2023-02-15',
        ipcClassification: ['G06N10/70', 'H03M13/00'],
        cpcClassification: ['G06N10/70', 'H03M13/6502'],
        technicalField: 'Quantum Computing',
        backgroundArt: 'Quantum computers are susceptible to errors from decoherence and gate imperfections. Error correction is essential for practical quantum computing applications.'
      }
    ];

    this.patentDatabase = samplePatents;
    
    // Update search index
    this.searchIndex = new Fuse(this.patentDatabase, {
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'abstract', weight: 0.4 },
        { name: 'technicalField', weight: 0.2 },
        { name: 'claims', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true
    });
  }

  /**
   * Find similar patents for prior art analysis
   */
  async findSimilarPatents(
    queryText: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('Prior art search not initialized');
    }

    const {
      limit = 10,
      threshold = 0.6,
      searchFields = ['title', 'abstract', 'claims'],
      includeExpired = true,
      dateRange,
      jurisdictions,
      technologyAreas
    } = options;

    // Multi-strategy search approach
    const results: SearchResult[] = [];

    // 1. Keyword-based fuzzy search
    const keywordResults = await this.performKeywordSearch(queryText, limit * 2);
    
    // 2. Semantic similarity search
    const semanticResults = await this.performSemanticSearch(queryText, limit * 2);
    
    // 3. Technical concept matching
    const conceptResults = await this.performConceptSearch(queryText, limit * 2);
    
    // 4. Classification-based search
    const classificationResults = await this.performClassificationSearch(queryText, limit * 2);

    // Combine and rank results
    const combinedResults = this.combineSearchResults([
      keywordResults,
      semanticResults,
      conceptResults,
      classificationResults
    ]);

    // Apply filters
    let filteredResults = combinedResults;
    
    if (dateRange) {
      filteredResults = this.filterByDateRange(filteredResults, dateRange);
    }
    
    if (jurisdictions && jurisdictions.length > 0) {
      filteredResults = this.filterByJurisdiction(filteredResults, jurisdictions);
    }
    
    if (technologyAreas && technologyAreas.length > 0) {
      filteredResults = this.filterByTechnologyArea(filteredResults, technologyAreas);
    }

    // Apply similarity threshold
    filteredResults = filteredResults.filter(result => result.similarity >= threshold);

    // Sort by relevance and limit results
    filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return filteredResults.slice(0, limit);
  }

  /**
   * Perform keyword-based fuzzy search
   */
  private async performKeywordSearch(query: string, limit: number): Promise<SearchResult[]> {
    const fuseResults = this.searchIndex.search(query, { limit });
    
    return fuseResults.map(result => ({
      patent: result.item,
      similarity: 1 - (result.score || 0),
      matchedFields: result.matches?.map(match => match.key) || [],
      relevanceScore: this.calculateRelevanceScore(result.item, query, 1 - (result.score || 0)),
      priorArtRelevance: this.assessPriorArtRelevance(result.item, query)
    }));
  }

  /**
   * Perform semantic similarity search
   */
  private async performSemanticSearch(query: string, limit: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    for (const patent of this.patentDatabase) {
      // Calculate semantic similarity using NLP engine
      const titleSimilarity = await this.nlpEngine.calculateTextSimilarity(query, patent.title);
      const abstractSimilarity = await this.nlpEngine.calculateTextSimilarity(query, patent.abstract);
      const claimsSimilarity = patent.claims.length > 0 ? 
        await this.nlpEngine.calculateTextSimilarity(query, patent.claims.join(' ')) : 0;
      
      // Weighted average of similarities
      const overallSimilarity = (titleSimilarity * 0.3 + abstractSimilarity * 0.5 + claimsSimilarity * 0.2);
      
      if (overallSimilarity > 0.1) { // Minimum threshold
        results.push({
          patent,
          similarity: overallSimilarity,
          matchedFields: ['semantic'],
          relevanceScore: this.calculateRelevanceScore(patent, query, overallSimilarity),
          priorArtRelevance: this.assessPriorArtRelevance(patent, query)
        });
      }
    }
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Perform technical concept-based search
   */
  private async performConceptSearch(query: string, limit: number): Promise<SearchResult[]> {
    const queryNLP = await this.nlpEngine.processPatentText(query);
    const results: SearchResult[] = [];
    
    for (const patent of this.patentDatabase) {
      const patentNLP = await this.nlpEngine.processPatentText(
        `${patent.title} ${patent.abstract} ${patent.claims.join(' ')}`
      );
      
      // Calculate concept overlap
      const conceptSimilarity = this.calculateConceptSimilarity(
        queryNLP.technicalConcepts,
        patentNLP.technicalConcepts
      );
      
      // Calculate entity overlap
      const entitySimilarity = this.calculateEntitySimilarity(
        queryNLP.entities,
        patentNLP.entities
      );
      
      const overallSimilarity = (conceptSimilarity * 0.7 + entitySimilarity * 0.3);
      
      if (overallSimilarity > 0.1) {
        results.push({
          patent,
          similarity: overallSimilarity,
          matchedFields: ['concepts', 'entities'],
          relevanceScore: this.calculateRelevanceScore(patent, query, overallSimilarity),
          priorArtRelevance: this.assessPriorArtRelevance(patent, query)
        });
      }
    }
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Perform classification-based search
   */
  private async performClassificationSearch(query: string, limit: number): Promise<SearchResult[]> {
    // This would use the PatentClassifier to find patents in similar technology areas
    // For now, we'll use a simplified approach based on IPC classification
    const results: SearchResult[] = [];
    
    // Extract technical field keywords from query
    const technicalKeywords = this.extractTechnicalKeywords(query);
    
    for (const patent of this.patentDatabase) {
      let similarity = 0;
      
      // Check technical field overlap
      const fieldSimilarity = this.calculateFieldSimilarity(
        technicalKeywords,
        patent.technicalField.toLowerCase().split(' ')
      );
      
      similarity += fieldSimilarity * 0.6;
      
      // Check IPC classification overlap (simplified)
      const ipcSimilarity = this.calculateIPCSimilarity(query, patent.ipcClassification);
      similarity += ipcSimilarity * 0.4;
      
      if (similarity > 0.1) {
        results.push({
          patent,
          similarity,
          matchedFields: ['classification', 'technicalField'],
          relevanceScore: this.calculateRelevanceScore(patent, query, similarity),
          priorArtRelevance: this.assessPriorArtRelevance(patent, query)
        });
      }
    }
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Combine results from multiple search strategies
   */
  private combineSearchResults(resultSets: SearchResult[][]): SearchResult[] {
    const combinedMap = new Map<string, SearchResult>();
    
    resultSets.forEach((results, strategyIndex) => {
      results.forEach(result => {
        const key = result.patent.id;
        
        if (combinedMap.has(key)) {
          const existing = combinedMap.get(key)!;
          // Combine similarities with weights based on strategy
          const weights = [0.3, 0.4, 0.2, 0.1]; // keyword, semantic, concept, classification
          existing.similarity = Math.max(existing.similarity, result.similarity * weights[strategyIndex]);
          existing.matchedFields = [...new Set([...existing.matchedFields, ...result.matchedFields])];
          existing.relevanceScore = Math.max(existing.relevanceScore, result.relevanceScore);
        } else {
          combinedMap.set(key, { ...result });
        }
      });
    });
    
    return Array.from(combinedMap.values());
  }

  /**
   * Calculate concept similarity between two sets of concepts
   */
  private calculateConceptSimilarity(concepts1: string[], concepts2: string[]): number {
    if (concepts1.length === 0 || concepts2.length === 0) return 0;
    
    const set1 = new Set(concepts1.map(c => c.toLowerCase()));
    const set2 = new Set(concepts2.map(c => c.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Calculate entity similarity
   */
  private calculateEntitySimilarity(entities1: any, entities2: any): number {
    let totalSimilarity = 0;
    let count = 0;
    
    const entityTypes = ['materials', 'processes', 'devices', 'measurements'];
    
    entityTypes.forEach(type => {
      if (entities1[type] && entities2[type]) {
        const similarity = this.calculateConceptSimilarity(entities1[type], entities2[type]);
        totalSimilarity += similarity;
        count++;
      }
    });
    
    return count > 0 ? totalSimilarity / count : 0;
  }

  /**
   * Extract technical keywords from query
   */
  private extractTechnicalKeywords(query: string): string[] {
    const technicalTerms = [
      'system', 'method', 'device', 'apparatus', 'process', 'algorithm',
      'network', 'sensor', 'controller', 'processor', 'circuit', 'interface',
      'machine learning', 'artificial intelligence', 'neural network',
      'blockchain', 'quantum', 'solar', 'battery', 'semiconductor',
      'medical', 'diagnostic', 'therapeutic', 'pharmaceutical'
    ];
    
    const lowerQuery = query.toLowerCase();
    return technicalTerms.filter(term => lowerQuery.includes(term));
  }

  /**
   * Calculate field similarity
   */
  private calculateFieldSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate IPC classification similarity (simplified)
   */
  private calculateIPCSimilarity(query: string, ipcCodes: string[]): number {
    // Simplified: check if query contains terms related to IPC sections
    const ipcSections = {
      'A': ['medical', 'health', 'food', 'agriculture'],
      'B': ['transport', 'manufacturing', 'separation'],
      'C': ['chemistry', 'metallurgy', 'materials'],
      'D': ['textile', 'paper'],
      'E': ['construction', 'building', 'mining'],
      'F': ['engine', 'mechanical', 'heating', 'lighting'],
      'G': ['physics', 'instrument', 'computing', 'optical'],
      'H': ['electrical', 'electronic', 'communication']
    };
    
    const lowerQuery = query.toLowerCase();
    let maxSimilarity = 0;
    
    ipcCodes.forEach(code => {
      const section = code.charAt(0);
      const sectionTerms = ipcSections[section as keyof typeof ipcSections] || [];
      
      const matches = sectionTerms.filter(term => lowerQuery.includes(term)).length;
      const similarity = matches / sectionTerms.length;
      
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });
    
    return maxSimilarity;
  }

  /**
   * Calculate relevance score for ranking
   */
  private calculateRelevanceScore(patent: PatentDocument, query: string, similarity: number): number {
    let score = similarity * 100;
    
    // Boost score based on patent age (newer patents might be more relevant)
    const patentAge = new Date().getFullYear() - new Date(patent.filingDate).getFullYear();
    if (patentAge < 5) score += 10;
    else if (patentAge < 10) score += 5;
    
    // Boost score for granted patents
    if (patent.grantDate) score += 5;
    
    // Boost score based on assignee reputation (simplified)
    if (patent.assignee.includes('Inc.') || patent.assignee.includes('Corp.')) {
      score += 3;
    }
    
    return score;
  }

  /**
   * Assess prior art relevance
   */
  private assessPriorArtRelevance(patent: PatentDocument, query: string): 'High' | 'Medium' | 'Low' {
    // This is a simplified assessment - in practice, this would be more sophisticated
    const queryLower = query.toLowerCase();
    const patentText = `${patent.title} ${patent.abstract}`.toLowerCase();
    
    // Count keyword matches
    const queryWords = queryLower.split(' ').filter(word => word.length > 3);
    const matches = queryWords.filter(word => patentText.includes(word)).length;
    const matchRatio = matches / queryWords.length;
    
    if (matchRatio > 0.6) return 'High';
    if (matchRatio > 0.3) return 'Medium';
    return 'Low';
  }

  /**
   * Filter results by date range
   */
  private filterByDateRange(results: SearchResult[], dateRange: { from: string; to: string }): SearchResult[] {
    return results.filter(result => {
      const filingDate = new Date(result.patent.filingDate);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      
      return filingDate >= fromDate && filingDate <= toDate;
    });
  }

  /**
   * Filter results by jurisdiction
   */
  private filterByJurisdiction(results: SearchResult[], jurisdictions: string[]): SearchResult[] {
    return results.filter(result => {
      const patentNumber = result.patent.patentNumber;
      return jurisdictions.some(jurisdiction => 
        patentNumber.startsWith(jurisdiction.toUpperCase())
      );
    });
  }

  /**
   * Filter results by technology area
   */
  private filterByTechnologyArea(results: SearchResult[], technologyAreas: string[]): SearchResult[] {
    return results.filter(result => {
      const technicalField = result.patent.technicalField.toLowerCase();
      return technologyAreas.some(area => 
        technicalField.includes(area.toLowerCase())
      );
    });
  }

  /**
   * Get detailed patent information
   */
  async getPatentDetails(patentId: string): Promise<PatentDocument | null> {
    return this.patentDatabase.find(patent => patent.id === patentId) || null;
  }

  /**
   * Search patents by specific criteria
   */
  async searchByCriteria(criteria: {
    inventor?: string;
    assignee?: string;
    ipcClass?: string;
    keyword?: string;
    dateRange?: { from: string; to: string };
  }): Promise<PatentDocument[]> {
    let results = [...this.patentDatabase];
    
    if (criteria.inventor) {
      results = results.filter(patent => 
        patent.inventors.some(inventor => 
          inventor.toLowerCase().includes(criteria.inventor!.toLowerCase())
        )
      );
    }
    
    if (criteria.assignee) {
      results = results.filter(patent => 
        patent.assignee.toLowerCase().includes(criteria.assignee!.toLowerCase())
      );
    }
    
    if (criteria.ipcClass) {
      results = results.filter(patent => 
        patent.ipcClassification.some(ipc => 
          ipc.startsWith(criteria.ipcClass!)
        )
      );
    }
    
    if (criteria.keyword) {
      const keyword = criteria.keyword.toLowerCase();
      results = results.filter(patent => 
        patent.title.toLowerCase().includes(keyword) ||
        patent.abstract.toLowerCase().includes(keyword) ||
        patent.claims.some(claim => claim.toLowerCase().includes(keyword))
      );
    }
    
    if (criteria.dateRange) {
      results = this.filterByDateRange(
        results.map(patent => ({ patent, similarity: 1, matchedFields: [], relevanceScore: 1, priorArtRelevance: 'Medium' as const })),
        criteria.dateRange
      ).map(result => result.patent);
    }
    
    return results;
  }

  /**
   * Generate prior art report
   */
  async generatePriorArtReport(queryText: string, searchResults: SearchResult[]): Promise<string> {
    const report = `
# Prior Art Analysis Report

## Query Analysis
**Input Text:** ${queryText.substring(0, 200)}...

## Search Summary
- **Total Results Found:** ${searchResults.length}
- **High Relevance:** ${searchResults.filter(r => r.priorArtRelevance === 'High').length}
- **Medium Relevance:** ${searchResults.filter(r => r.priorArtRelevance === 'Medium').length}
- **Low Relevance:** ${searchResults.filter(r => r.priorArtRelevance === 'Low').length}

## Detailed Results

${searchResults.map((result, index) => `
### ${index + 1}. ${result.patent.title}
- **Patent Number:** ${result.patent.patentNumber}
- **Similarity Score:** ${(result.similarity * 100).toFixed(1)}%
- **Relevance:** ${result.priorArtRelevance}
- **Filing Date:** ${result.patent.filingDate}
- **Assignee:** ${result.patent.assignee}
- **IPC Classification:** ${result.patent.ipcClassification.join(', ')}

**Abstract:** ${result.patent.abstract}

**Matched Fields:** ${result.matchedFields.join(', ')}

---
`).join('')}

## Recommendations
${this.generateRecommendations(searchResults)}
    `;
    
    return report.trim();
  }

  /**
   * Generate recommendations based on search results
   */
  private generateRecommendations(results: SearchResult[]): string {
    const highRelevanceCount = results.filter(r => r.priorArtRelevance === 'High').length;
    const recommendations: string[] = [];
    
    if (highRelevanceCount > 3) {
      recommendations.push('- **High Prior Art Risk:** Multiple highly relevant patents found. Consider significant modifications to differentiate your invention.');
    } else if (highRelevanceCount > 0) {
      recommendations.push('- **Moderate Prior Art Risk:** Some relevant patents found. Review claims carefully and focus on novel aspects.');
    } else {
      recommendations.push('- **Low Prior Art Risk:** No highly similar patents found in this search. Consider broader search terms.');
    }
    
    // Technology-specific recommendations
    const techAreas = [...new Set(results.map(r => r.patent.technicalField))];
    if (techAreas.length > 1) {
      recommendations.push(`- **Cross-Technology Relevance:** Patents found across multiple technology areas: ${techAreas.join(', ')}`);
    }
    
    // Date-based recommendations
    const recentPatents = results.filter(r => 
      new Date(r.patent.filingDate).getFullYear() >= new Date().getFullYear() - 3
    ).length;
    
    if (recentPatents > 0) {
      recommendations.push(`- **Recent Activity:** ${recentPatents} patents filed in the last 3 years in this area.`);
    }
    
    return recommendations.join('\n');
  }
}