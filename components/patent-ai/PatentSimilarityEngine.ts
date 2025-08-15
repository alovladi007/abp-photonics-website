import * as tf from '@tensorflow/tfjs';
import { cosineSimilarity } from 'cosine-similarity';
import stringSimilarity from 'string-similarity';

interface SimilarityResult {
  overallSimilarity: number;
  componentSimilarities: {
    textual: number;
    semantic: number;
    structural: number;
    technical: number;
  };
  confidence: number;
  explanation: string[];
}

interface PatentEmbedding {
  textEmbedding: number[];
  conceptEmbedding: number[];
  structuralFeatures: number[];
  technicalFeatures: number[];
}

export class PatentSimilarityEngine {
  private embeddingModel: tf.LayersModel | null = null;
  private isInitialized = false;
  private vocabularySize = 10000;
  private embeddingDim = 256;

  constructor() {
    this.initializeEngine();
  }

  /**
   * Initialize the similarity engine
   */
  private async initializeEngine(): Promise<void> {
    try {
      await this.createEmbeddingModel();
      this.isInitialized = true;
      console.log('Patent similarity engine initialized');
    } catch (error) {
      console.error('Failed to initialize similarity engine:', error);
    }
  }

  /**
   * Create embedding model for semantic similarity
   */
  private async createEmbeddingModel(): Promise<void> {
    // Create a simple embedding model for demonstration
    // In practice, this would be a pre-trained model like BERT or a domain-specific model
    const model = tf.sequential({
      layers: [
        tf.layers.embedding({
          inputDim: this.vocabularySize,
          outputDim: this.embeddingDim,
          inputLength: 500 // Max sequence length
        }),
        tf.layers.globalAveragePooling1d(),
        tf.layers.dense({
          units: 128,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: this.embeddingDim,
          activation: 'tanh'
        })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    this.embeddingModel = model;
  }

  /**
   * Calculate comprehensive similarity between two patent texts
   */
  async calculateSimilarity(text1: string, text2: string): Promise<number>;
  async calculateSimilarity(text1: string, texts: string[]): Promise<number[]>;
  async calculateSimilarity(text1: string, text2OrTexts: string | string[]): Promise<number | number[]> {
    if (!this.isInitialized) {
      throw new Error('Similarity engine not initialized');
    }

    if (Array.isArray(text2OrTexts)) {
      // Calculate similarity with multiple texts
      const similarities: number[] = [];
      for (const text2 of text2OrTexts) {
        const similarity = await this.calculatePairwiseSimilarity(text1, text2);
        similarities.push(similarity.overallSimilarity);
      }
      return similarities;
    } else {
      // Calculate similarity with single text
      const result = await this.calculatePairwiseSimilarity(text1, text2OrTexts);
      return result.overallSimilarity;
    }
  }

  /**
   * Calculate detailed similarity between two patent texts
   */
  async calculateDetailedSimilarity(text1: string, text2: string): Promise<SimilarityResult> {
    return this.calculatePairwiseSimilarity(text1, text2);
  }

  /**
   * Calculate pairwise similarity with detailed breakdown
   */
  private async calculatePairwiseSimilarity(text1: string, text2: string): Promise<SimilarityResult> {
    // 1. Textual similarity using string matching algorithms
    const textualSimilarity = this.calculateTextualSimilarity(text1, text2);

    // 2. Semantic similarity using embeddings
    const semanticSimilarity = await this.calculateSemanticSimilarity(text1, text2);

    // 3. Structural similarity based on patent structure
    const structuralSimilarity = this.calculateStructuralSimilarity(text1, text2);

    // 4. Technical similarity based on technical concepts
    const technicalSimilarity = await this.calculateTechnicalSimilarity(text1, text2);

    // Combine similarities with weights
    const weights = {
      textual: 0.25,
      semantic: 0.35,
      structural: 0.20,
      technical: 0.20
    };

    const overallSimilarity = 
      textualSimilarity * weights.textual +
      semanticSimilarity * weights.semantic +
      structuralSimilarity * weights.structural +
      technicalSimilarity * weights.technical;

    // Calculate confidence based on consistency of different measures
    const similarities = [textualSimilarity, semanticSimilarity, structuralSimilarity, technicalSimilarity];
    const mean = similarities.reduce((a, b) => a + b) / similarities.length;
    const variance = similarities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / similarities.length;
    const confidence = Math.max(0, 1 - Math.sqrt(variance));

    // Generate explanation
    const explanation = this.generateSimilarityExplanation({
      textual: textualSimilarity,
      semantic: semanticSimilarity,
      structural: structuralSimilarity,
      technical: technicalSimilarity
    });

    return {
      overallSimilarity,
      componentSimilarities: {
        textual: textualSimilarity,
        semantic: semanticSimilarity,
        structural: structuralSimilarity,
        technical: technicalSimilarity
      },
      confidence,
      explanation
    };
  }

  /**
   * Calculate textual similarity using multiple string matching algorithms
   */
  private calculateTextualSimilarity(text1: string, text2: string): number {
    // Preprocess texts
    const processed1 = this.preprocessText(text1);
    const processed2 = this.preprocessText(text2);

    // 1. Jaccard similarity (token-based)
    const jaccardSim = this.calculateJaccardSimilarity(processed1, processed2);

    // 2. Cosine similarity (character n-grams)
    const cosineSim = this.calculateCosineTextSimilarity(processed1, processed2);

    // 3. String similarity (edit distance based)
    const stringSim = stringSimilarity.compareTwoStrings(processed1, processed2);

    // 4. Longest common subsequence similarity
    const lcsSim = this.calculateLCSSimilarity(processed1, processed2);

    // Weighted combination
    return (jaccardSim * 0.3 + cosineSim * 0.3 + stringSim * 0.2 + lcsSim * 0.2);
  }

  /**
   * Calculate semantic similarity using embeddings
   */
  private async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    try {
      // Generate embeddings for both texts
      const embedding1 = await this.generateTextEmbedding(text1);
      const embedding2 = await this.generateTextEmbedding(text2);

      // Calculate cosine similarity between embeddings
      return this.calculateVectorSimilarity(embedding1, embedding2);
    } catch (error) {
      console.error('Error calculating semantic similarity:', error);
      // Fallback to textual similarity
      return this.calculateTextualSimilarity(text1, text2) * 0.8;
    }
  }

  /**
   * Calculate structural similarity based on patent document structure
   */
  private calculateStructuralSimilarity(text1: string, text2: string): number {
    // Extract structural features
    const features1 = this.extractStructuralFeatures(text1);
    const features2 = this.extractStructuralFeatures(text2);

    // Calculate similarity between structural features
    let similarity = 0;
    let featureCount = 0;

    // Compare each structural feature
    Object.keys(features1).forEach(key => {
      if (key in features2) {
        const feature1 = features1[key as keyof typeof features1];
        const feature2 = features2[key as keyof typeof features2];
        
        if (typeof feature1 === 'number' && typeof feature2 === 'number') {
          // Normalize numerical features and calculate similarity
          const maxVal = Math.max(feature1, feature2);
          const minVal = Math.min(feature1, feature2);
          similarity += maxVal > 0 ? minVal / maxVal : 1;
        } else if (Array.isArray(feature1) && Array.isArray(feature2)) {
          // Calculate Jaccard similarity for array features
          similarity += this.calculateJaccardSimilarity(feature1.join(' '), feature2.join(' '));
        }
        featureCount++;
      }
    });

    return featureCount > 0 ? similarity / featureCount : 0;
  }

  /**
   * Calculate technical similarity based on technical concepts and entities
   */
  private async calculateTechnicalSimilarity(text1: string, text2: string): Promise<number> {
    // Extract technical features
    const techFeatures1 = this.extractTechnicalFeatures(text1);
    const techFeatures2 = this.extractTechnicalFeatures(text2);

    // Calculate similarity between technical vocabularies
    const vocabSimilarity = this.calculateJaccardSimilarity(
      techFeatures1.technicalTerms.join(' '),
      techFeatures2.technicalTerms.join(' ')
    );

    // Calculate similarity between measurements and specifications
    const measurementSimilarity = this.calculateMeasurementSimilarity(
      techFeatures1.measurements,
      techFeatures2.measurements
    );

    // Calculate similarity between process descriptions
    const processSimilarity = this.calculateJaccardSimilarity(
      techFeatures1.processes.join(' '),
      techFeatures2.processes.join(' ')
    );

    // Weighted combination
    return (vocabSimilarity * 0.5 + measurementSimilarity * 0.3 + processSimilarity * 0.2);
  }

  /**
   * Generate text embedding using the embedding model
   */
  private async generateTextEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingModel) {
      throw new Error('Embedding model not initialized');
    }

    // Tokenize and convert to indices (simplified)
    const tokens = this.tokenizeText(text);
    const indices = tokens.map(token => this.getTokenIndex(token));
    
    // Pad or truncate to fixed length
    const paddedIndices = this.padSequence(indices, 500);
    
    // Generate embedding
    const inputTensor = tf.tensor2d([paddedIndices], [1, paddedIndices.length]);
    const embedding = this.embeddingModel.predict(inputTensor) as tf.Tensor;
    const embeddingArray = await embedding.data();
    
    // Clean up tensors
    inputTensor.dispose();
    embedding.dispose();
    
    return Array.from(embeddingArray);
  }

  /**
   * Calculate vector similarity (cosine similarity)
   */
  private calculateVectorSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    // Calculate dot product
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    // Calculate cosine similarity
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Preprocess text for similarity calculation
   */
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate Jaccard similarity between two texts
   */
  private calculateJaccardSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(text1.split(/\s+/));
    const tokens2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate cosine similarity for text (character n-grams)
   */
  private calculateCosineTextSimilarity(text1: string, text2: string): number {
    // Generate character trigrams
    const trigrams1 = this.generateNGrams(text1, 3);
    const trigrams2 = this.generateNGrams(text2, 3);
    
    // Create frequency vectors
    const allTrigrams = new Set([...trigrams1.keys(), ...trigrams2.keys()]);
    const vec1: number[] = [];
    const vec2: number[] = [];
    
    allTrigrams.forEach(trigram => {
      vec1.push(trigrams1.get(trigram) || 0);
      vec2.push(trigrams2.get(trigram) || 0);
    });
    
    return this.calculateVectorSimilarity(vec1, vec2);
  }

  /**
   * Calculate Longest Common Subsequence similarity
   */
  private calculateLCSSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const lcsLength = this.longestCommonSubsequence(words1, words2);
    const maxLength = Math.max(words1.length, words2.length);
    
    return maxLength > 0 ? lcsLength / maxLength : 0;
  }

  /**
   * Generate n-grams from text
   */
  private generateNGrams(text: string, n: number): Map<string, number> {
    const ngrams = new Map<string, number>();
    
    for (let i = 0; i <= text.length - n; i++) {
      const ngram = text.substring(i, i + n);
      ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1);
    }
    
    return ngrams;
  }

  /**
   * Calculate longest common subsequence length
   */
  private longestCommonSubsequence(seq1: string[], seq2: string[]): number {
    const m = seq1.length;
    const n = seq2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (seq1[i - 1] === seq2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    return dp[m][n];
  }

  /**
   * Extract structural features from patent text
   */
  private extractStructuralFeatures(text: string): {
    sentenceCount: number;
    averageSentenceLength: number;
    paragraphCount: number;
    claimCount: number;
    figureReferences: string[];
    technicalTermDensity: number;
  } {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Count claims (simplified)
    const claimMatches = text.match(/\b(?:claim|claims)\s+\d+/gi) || [];
    
    // Extract figure references
    const figureRefs = text.match(/\b(?:fig|figure)\s*\.?\s*\d+[a-z]?/gi) || [];
    
    // Calculate technical term density
    const technicalTerms = text.match(/\b(?:system|method|apparatus|device|process|component|element|structure|mechanism|assembly|circuit|module|interface|controller|processor|sensor|detector|generator|converter|transformer)\b/gi) || [];
    const words = text.split(/\s+/).length;
    const technicalTermDensity = words > 0 ? technicalTerms.length / words : 0;
    
    const totalSentenceLength = sentences.reduce((sum, sentence) => sum + sentence.length, 0);
    const averageSentenceLength = sentences.length > 0 ? totalSentenceLength / sentences.length : 0;
    
    return {
      sentenceCount: sentences.length,
      averageSentenceLength,
      paragraphCount: paragraphs.length,
      claimCount: claimMatches.length,
      figureReferences: figureRefs,
      technicalTermDensity
    };
  }

  /**
   * Extract technical features from patent text
   */
  private extractTechnicalFeatures(text: string): {
    technicalTerms: string[];
    measurements: string[];
    processes: string[];
    materials: string[];
  } {
    const lowerText = text.toLowerCase();
    
    // Technical terms
    const technicalTerms = text.match(/\b(?:system|method|apparatus|device|process|algorithm|network|sensor|controller|processor|circuit|interface|machine learning|artificial intelligence|neural network|blockchain|quantum|semiconductor|nanotechnology|biotechnology)\b/gi) || [];
    
    // Measurements and specifications
    const measurements = text.match(/\b\d+(?:\.\d+)?\s*(?:nm|μm|mm|cm|m|km|mg|g|kg|ml|l|°C|°F|K|Hz|MHz|GHz|V|mV|A|mA|Ω|W|kW|MW|Pa|kPa|MPa|GPa|psi|bar|atm|%)\b/gi) || [];
    
    // Process-related terms
    const processes = text.match(/\b(?:manufactur|fabricat|process|synthesiz|deposit|etch|anneal|cure|polish|treat|coat|form|mold|cast|assembly|production|treatment|purification|separation|extraction|conversion)\w*\b/gi) || [];
    
    // Material-related terms
    const materials = text.match(/\b(?:polymer|ceramic|metal|alloy|composite|semiconductor|crystal|substrate|membrane|coating|film|layer|silicon|aluminum|copper|steel|plastic|glass|carbon|titanium)\w*\b/gi) || [];
    
    return {
      technicalTerms: [...new Set(technicalTerms.map(term => term.toLowerCase()))],
      measurements: [...new Set(measurements)],
      processes: [...new Set(processes.map(term => term.toLowerCase()))],
      materials: [...new Set(materials.map(term => term.toLowerCase()))]
    };
  }

  /**
   * Calculate similarity between measurement arrays
   */
  private calculateMeasurementSimilarity(measurements1: string[], measurements2: string[]): number {
    if (measurements1.length === 0 && measurements2.length === 0) return 1;
    if (measurements1.length === 0 || measurements2.length === 0) return 0;
    
    // Extract units and values
    const extractMeasurement = (measurement: string) => {
      const match = measurement.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z%°]+)/);
      return match ? { value: parseFloat(match[1]), unit: match[2].toLowerCase() } : null;
    };
    
    const parsed1 = measurements1.map(extractMeasurement).filter(m => m !== null);
    const parsed2 = measurements2.map(extractMeasurement).filter(m => m !== null);
    
    if (parsed1.length === 0 && parsed2.length === 0) return 1;
    if (parsed1.length === 0 || parsed2.length === 0) return 0;
    
    // Group by unit
    const units1 = new Set(parsed1.map(m => m!.unit));
    const units2 = new Set(parsed2.map(m => m!.unit));
    const commonUnits = new Set([...units1].filter(unit => units2.has(unit)));
    
    if (commonUnits.size === 0) return 0;
    
    // Calculate similarity for common units
    let totalSimilarity = 0;
    let unitCount = 0;
    
    commonUnits.forEach(unit => {
      const values1 = parsed1.filter(m => m!.unit === unit).map(m => m!.value);
      const values2 = parsed2.filter(m => m!.unit === unit).map(m => m!.value);
      
      // Calculate value range overlap
      const min1 = Math.min(...values1);
      const max1 = Math.max(...values1);
      const min2 = Math.min(...values2);
      const max2 = Math.max(...values2);
      
      const overlapMin = Math.max(min1, min2);
      const overlapMax = Math.min(max1, max2);
      const overlapSize = Math.max(0, overlapMax - overlapMin);
      const totalRange = Math.max(max1, max2) - Math.min(min1, min2);
      
      const similarity = totalRange > 0 ? overlapSize / totalRange : 1;
      totalSimilarity += similarity;
      unitCount++;
    });
    
    return unitCount > 0 ? totalSimilarity / unitCount : 0;
  }

  /**
   * Tokenize text (simplified)
   */
  private tokenizeText(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Get token index (simplified vocabulary mapping)
   */
  private getTokenIndex(token: string): number {
    // Simple hash-based mapping for demonstration
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % this.vocabularySize;
  }

  /**
   * Pad or truncate sequence to fixed length
   */
  private padSequence(sequence: number[], maxLength: number): number[] {
    if (sequence.length >= maxLength) {
      return sequence.slice(0, maxLength);
    } else {
      return [...sequence, ...Array(maxLength - sequence.length).fill(0)];
    }
  }

  /**
   * Generate explanation for similarity scores
   */
  private generateSimilarityExplanation(similarities: {
    textual: number;
    semantic: number;
    structural: number;
    technical: number;
  }): string[] {
    const explanation: string[] = [];
    
    // Overall assessment
    const overall = (similarities.textual + similarities.semantic + similarities.structural + similarities.technical) / 4;
    if (overall > 0.8) {
      explanation.push('Very high similarity - patents are likely closely related');
    } else if (overall > 0.6) {
      explanation.push('High similarity - patents share significant common elements');
    } else if (overall > 0.4) {
      explanation.push('Moderate similarity - patents have some overlapping concepts');
    } else if (overall > 0.2) {
      explanation.push('Low similarity - patents have limited common elements');
    } else {
      explanation.push('Very low similarity - patents appear to be in different domains');
    }
    
    // Component-specific explanations
    if (similarities.textual > 0.7) {
      explanation.push('High textual overlap in vocabulary and phrasing');
    }
    
    if (similarities.semantic > 0.7) {
      explanation.push('Strong semantic similarity in meaning and concepts');
    }
    
    if (similarities.structural > 0.7) {
      explanation.push('Similar document structure and organization');
    }
    
    if (similarities.technical > 0.7) {
      explanation.push('Significant overlap in technical terms and specifications');
    }
    
    // Identify strongest similarity component
    const maxComponent = Object.entries(similarities).reduce((a, b) => 
      similarities[a[0] as keyof typeof similarities] > similarities[b[0] as keyof typeof similarities] ? a : b
    );
    
    explanation.push(`Strongest similarity: ${maxComponent[0]} (${(maxComponent[1] * 100).toFixed(1)}%)`);
    
    return explanation;
  }

  /**
   * Batch similarity calculation for efficiency
   */
  async calculateBatchSimilarity(
    referenceText: string, 
    targetTexts: string[]
  ): Promise<SimilarityResult[]> {
    const results: SimilarityResult[] = [];
    
    // Process in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < targetTexts.length; i += batchSize) {
      const batch = targetTexts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(targetText => this.calculatePairwiseSimilarity(referenceText, targetText))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Get similarity threshold recommendations
   */
  getThresholdRecommendations(): {
    highSimilarity: number;
    moderateSimilarity: number;
    lowSimilarity: number;
    description: string;
  } {
    return {
      highSimilarity: 0.7,
      moderateSimilarity: 0.4,
      lowSimilarity: 0.2,
      description: 'Recommended thresholds: High (>0.7) indicates potential prior art concern, Moderate (0.4-0.7) suggests related technology, Low (<0.4) indicates different domains'
    };
  }
}