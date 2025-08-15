import * as natural from 'natural';
import * as compromise from 'compromise';
import { removeStopwords } from 'stopwords';
import { stemmer } from 'stemmer';

interface PatentNLPResult {
  technicalConcepts: string[];
  claims: {
    independent: string[];
    dependent: string[];
  };
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
}

interface ProcessingOptions {
  extractClaims?: boolean;
  identifyEntities?: boolean;
  generateSummary?: boolean;
  calculateComplexity?: boolean;
}

export class PatentNLPEngine {
  private stemmer: any;
  private tokenizer: any;
  private sentenceTokenizer: any;
  private tfidf: any;
  private wordNet: any;
  
  // Technical vocabulary patterns
  private readonly TECHNICAL_PATTERNS = {
    materials: /\b(?:polymer|ceramic|metal|alloy|composite|semiconductor|crystal|substrate|membrane|coating|film|layer)\w*\b/gi,
    processes: /\b(?:manufactur|fabricat|process|synthesiz|deposit|etch|anneal|cure|polish|treat|coat|form|mold|cast)\w*\b/gi,
    devices: /\b(?:sensor|actuator|transistor|capacitor|resistor|inductor|diode|circuit|processor|controller|module|assembly|apparatus|device|system|mechanism|component)\w*\b/gi,
    measurements: /\b(?:\d+(?:\.\d+)?\s*(?:nm|μm|mm|cm|m|kg|g|mg|°C|K|Hz|MHz|GHz|V|mV|A|mA|Ω|W|Pa|MPa|GPa|psi))\b/gi
  };

  private readonly CLAIM_INDICATORS = [
    'What is claimed is:',
    'I claim:',
    'We claim:',
    'The invention claimed is:',
    'Claims:'
  ];

  constructor() {
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    this.sentenceTokenizer = new natural.SentenceTokenizer();
    this.tfidf = new natural.TfIdf();
    
    // Initialize stemmer
    natural.PorterStemmer.attach();
  }

  /**
   * Main processing function for patent text
   */
  async processPatentText(text: string, options: ProcessingOptions = {}): Promise<PatentNLPResult> {
    const {
      extractClaims = true,
      identifyEntities = true,
      generateSummary = true,
      calculateComplexity = true
    } = options;

    // Preprocess text
    const cleanedText = this.preprocessText(text);
    
    // Extract claims if requested
    const claims = extractClaims ? this.extractClaims(text) : { independent: [], dependent: [] };
    
    // Identify technical entities
    const entities = identifyEntities ? this.identifyTechnicalEntities(cleanedText) : {
      materials: [],
      processes: [],
      devices: [],
      measurements: []
    };
    
    // Extract technical concepts
    const technicalConcepts = this.extractTechnicalConcepts(cleanedText);
    
    // Extract key phrases
    const keyPhrases = this.extractKeyPhrases(cleanedText);
    
    // Generate summary if requested
    const abstractSummary = generateSummary ? this.generateAbstractSummary(cleanedText) : '';
    
    // Calculate technical complexity
    const technicalComplexity = calculateComplexity ? this.calculateTechnicalComplexity(cleanedText, entities, technicalConcepts) : 0;
    
    // Calculate readability score
    const readabilityScore = this.calculateReadabilityScore(cleanedText);

    return {
      technicalConcepts,
      claims,
      entities,
      keyPhrases,
      abstractSummary,
      technicalComplexity,
      readabilityScore
    };
  }

  /**
   * Preprocess patent text for analysis
   */
  private preprocessText(text: string): string {
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Remove figure references
    cleaned = cleaned.replace(/\bFIG\.\s*\d+[A-Z]?\b/gi, '');
    cleaned = cleaned.replace(/\bFigure\s*\d+[A-Z]?\b/gi, '');
    
    // Remove reference numerals in parentheses
    cleaned = cleaned.replace(/\(\d+[A-Z]?\)/g, '');
    
    // Remove patent-specific formatting
    cleaned = cleaned.replace(/\[0*\d+\]/g, ''); // Remove paragraph numbers
    cleaned = cleaned.replace(/^\s*\d+\.\s*/gm, ''); // Remove numbered lists at line start
    
    return cleaned;
  }

  /**
   * Extract patent claims from text
   */
  private extractClaims(text: string): { independent: string[]; dependent: string[] } {
    const claims = { independent: [], dependent: [] };
    
    // Find the claims section
    let claimsSection = '';
    for (const indicator of this.CLAIM_INDICATORS) {
      const index = text.indexOf(indicator);
      if (index !== -1) {
        claimsSection = text.substring(index);
        break;
      }
    }
    
    if (!claimsSection) {
      // Try to find claims by pattern matching
      const claimPattern = /(?:^|\n)\s*(\d+)\.\s*([^]+?)(?=(?:^|\n)\s*\d+\.|$)/gm;
      let match;
      
      while ((match = claimPattern.exec(text)) !== null) {
        const claimNumber = parseInt(match[1]);
        const claimText = match[2].trim();
        
        // Determine if claim is independent or dependent
        if (this.isIndependentClaim(claimText)) {
          claims.independent.push(`Claim ${claimNumber}: ${claimText}`);
        } else {
          claims.dependent.push(`Claim ${claimNumber}: ${claimText}`);
        }
      }
    } else {
      // Process claims section
      const claimPattern = /(\d+)\.\s*([^]+?)(?=\d+\.|$)/g;
      let match;
      
      while ((match = claimPattern.exec(claimsSection)) !== null) {
        const claimNumber = parseInt(match[1]);
        const claimText = match[2].trim();
        
        if (this.isIndependentClaim(claimText)) {
          claims.independent.push(`Claim ${claimNumber}: ${claimText}`);
        } else {
          claims.dependent.push(`Claim ${claimNumber}: ${claimText}`);
        }
      }
    }
    
    return claims;
  }

  /**
   * Determine if a claim is independent
   */
  private isIndependentClaim(claimText: string): boolean {
    const dependentIndicators = [
      'according to claim',
      'of claim',
      'as claimed in',
      'as defined in claim',
      'wherein',
      'further comprising',
      'further including'
    ];
    
    const lowerText = claimText.toLowerCase();
    return !dependentIndicators.some(indicator => lowerText.includes(indicator));
  }

  /**
   * Identify technical entities in the text
   */
  private identifyTechnicalEntities(text: string): PatentNLPResult['entities'] {
    const entities = {
      materials: [],
      processes: [],
      devices: [],
      measurements: []
    };

    // Extract materials
    const materialMatches = text.match(this.TECHNICAL_PATTERNS.materials) || [];
    entities.materials = [...new Set(materialMatches.map(m => m.toLowerCase()))];

    // Extract processes
    const processMatches = text.match(this.TECHNICAL_PATTERNS.processes) || [];
    entities.processes = [...new Set(processMatches.map(m => m.toLowerCase()))];

    // Extract devices
    const deviceMatches = text.match(this.TECHNICAL_PATTERNS.devices) || [];
    entities.devices = [...new Set(deviceMatches.map(m => m.toLowerCase()))];

    // Extract measurements
    const measurementMatches = text.match(this.TECHNICAL_PATTERNS.measurements) || [];
    entities.measurements = [...new Set(measurementMatches)];

    return entities;
  }

  /**
   * Extract technical concepts using NLP techniques
   */
  private extractTechnicalConcepts(text: string): string[] {
    const doc = compromise(text);
    
    // Extract noun phrases that are likely technical concepts
    const nounPhrases = doc.match('#Noun+ #Noun').out('array');
    const technicalTerms = doc.match('#Adjective? #Noun').out('array');
    
    // Combine and filter
    const allConcepts = [...nounPhrases, ...technicalTerms];
    
    // Filter for technical relevance
    const technicalConcepts = allConcepts.filter(concept => {
      const words = concept.toLowerCase().split(' ');
      return words.length >= 2 && words.length <= 4 && 
             words.some(word => this.isTechnicalWord(word));
    });

    // Remove duplicates and sort by relevance
    return [...new Set(technicalConcepts)]
      .slice(0, 20) // Limit to top 20 concepts
      .sort((a, b) => b.length - a.length);
  }

  /**
   * Check if a word is technical
   */
  private isTechnicalWord(word: string): boolean {
    const technicalIndicators = [
      'system', 'method', 'device', 'apparatus', 'component', 'element',
      'process', 'technique', 'mechanism', 'structure', 'assembly',
      'circuit', 'module', 'unit', 'interface', 'controller', 'processor',
      'sensor', 'detector', 'generator', 'converter', 'transformer',
      'material', 'compound', 'polymer', 'metal', 'ceramic', 'composite',
      'layer', 'coating', 'film', 'substrate', 'membrane', 'surface'
    ];
    
    return technicalIndicators.some(indicator => 
      word.includes(indicator) || indicator.includes(word)
    );
  }

  /**
   * Extract key phrases using TF-IDF
   */
  private extractKeyPhrases(text: string): string[] {
    // Tokenize and clean
    const sentences = this.sentenceTokenizer.tokenize(text);
    const words = this.tokenizer.tokenize(text.toLowerCase());
    
    // Remove stop words and stem
    const filteredWords = removeStopwords(words).map(word => stemmer(word));
    
    // Add to TF-IDF
    this.tfidf.addDocument(filteredWords);
    
    // Get top terms
    const keyTerms: Array<{ term: string; tfidf: number }> = [];
    this.tfidf.listTerms(0).forEach((item: any) => {
      if (item.tfidf > 0.1) { // Threshold for relevance
        keyTerms.push({ term: item.term, tfidf: item.tfidf });
      }
    });
    
    // Extract phrases containing key terms
    const keyPhrases: string[] = [];
    sentences.forEach(sentence => {
      keyTerms.forEach(term => {
        if (sentence.toLowerCase().includes(term.term)) {
          // Extract phrase around the key term
          const phrases = this.extractPhrasesAroundTerm(sentence, term.term);
          keyPhrases.push(...phrases);
        }
      });
    });
    
    return [...new Set(keyPhrases)].slice(0, 15);
  }

  /**
   * Extract phrases around a key term
   */
  private extractPhrasesAroundTerm(sentence: string, term: string): string[] {
    const words = sentence.split(' ');
    const termIndex = words.findIndex(word => 
      word.toLowerCase().includes(term.toLowerCase())
    );
    
    if (termIndex === -1) return [];
    
    const phrases: string[] = [];
    
    // Extract 3-5 word phrases around the term
    for (let len = 3; len <= 5; len++) {
      for (let start = Math.max(0, termIndex - len + 1); 
           start <= Math.min(words.length - len, termIndex); 
           start++) {
        if (start + len <= words.length) {
          const phrase = words.slice(start, start + len).join(' ');
          if (phrase.length > 10 && phrase.length < 100) {
            phrases.push(phrase);
          }
        }
      }
    }
    
    return phrases;
  }

  /**
   * Generate abstract summary
   */
  private generateAbstractSummary(text: string): string {
    const sentences = this.sentenceTokenizer.tokenize(text);
    
    if (sentences.length <= 3) return text;
    
    // Score sentences based on technical terms and position
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position bonus (first and last sentences often important)
      if (index === 0) score += 2;
      if (index === sentences.length - 1) score += 1;
      
      // Technical term bonus
      const technicalWords = sentence.match(this.TECHNICAL_PATTERNS.devices) || [];
      score += technicalWords.length * 0.5;
      
      // Length penalty for very short or very long sentences
      if (sentence.length < 50 || sentence.length > 200) score -= 1;
      
      return { sentence, score, index };
    });
    
    // Select top 3 sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence);
    
    return topSentences.join(' ');
  }

  /**
   * Calculate technical complexity score
   */
  private calculateTechnicalComplexity(
    text: string, 
    entities: PatentNLPResult['entities'], 
    concepts: string[]
  ): number {
    let complexity = 0;
    
    // Base complexity from text length
    complexity += Math.min(text.length / 10000, 2);
    
    // Entity diversity bonus
    const totalEntities = entities.materials.length + entities.processes.length + 
                         entities.devices.length + entities.measurements.length;
    complexity += Math.min(totalEntities / 10, 3);
    
    // Technical concepts bonus
    complexity += Math.min(concepts.length / 5, 2);
    
    // Measurement precision bonus
    const precisionMeasurements = entities.measurements.filter(m => 
      m.includes('.') || m.includes('μ') || m.includes('nm')
    ).length;
    complexity += Math.min(precisionMeasurements / 5, 1);
    
    // Vocabulary sophistication
    const words = this.tokenizer.tokenize(text.toLowerCase());
    const uniqueWords = new Set(words);
    const vocabularyRichness = uniqueWords.size / words.length;
    complexity += vocabularyRichness * 2;
    
    return Math.min(complexity, 10); // Cap at 10
  }

  /**
   * Calculate readability score (modified Flesch-Kincaid)
   */
  private calculateReadabilityScore(text: string): number {
    const sentences = this.sentenceTokenizer.tokenize(text);
    const words = this.tokenizer.tokenize(text);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    // Count syllables (simplified)
    const syllableCount = words.reduce((count, word) => {
      return count + this.countSyllables(word);
    }, 0);
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllableCount / words.length;
    
    // Modified Flesch Reading Ease (adapted for technical content)
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    // Normalize to 0-100 scale where higher is more readable
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in a word (simplified algorithm)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Handle silent 'e'
    if (word.endsWith('e')) {
      count--;
    }
    
    return Math.max(1, count);
  }

  /**
   * Analyze patent similarity to a reference text
   */
  async calculateTextSimilarity(text1: string, text2: string): Promise<number> {
    const doc1 = compromise(text1);
    const doc2 = compromise(text2);
    
    // Extract key terms from both texts
    const terms1 = new Set(doc1.match('#Noun').out('array').map(term => term.toLowerCase()));
    const terms2 = new Set(doc2.match('#Noun').out('array').map(term => term.toLowerCase()));
    
    // Calculate Jaccard similarity
    const intersection = new Set([...terms1].filter(x => terms2.has(x)));
    const union = new Set([...terms1, ...terms2]);
    
    return intersection.size / union.size;
  }

  /**
   * Extract technical specifications from text
   */
  extractTechnicalSpecs(text: string): Array<{ parameter: string; value: string; unit?: string }> {
    const specs: Array<{ parameter: string; value: string; unit?: string }> = [];
    
    // Pattern for technical specifications
    const specPattern = /(\w+(?:\s+\w+)*)\s*(?:is|are|of|:)\s*(\d+(?:\.\d+)?)\s*([a-zA-Z%°]+)?/g;
    let match;
    
    while ((match = specPattern.exec(text)) !== null) {
      specs.push({
        parameter: match[1].trim(),
        value: match[2],
        unit: match[3] || undefined
      });
    }
    
    return specs;
  }
}