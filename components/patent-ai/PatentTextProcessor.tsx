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

export class PatentTextProcessor {
  private static tokenizer = new natural.WordTokenizer();
  private static stemmer = natural.PorterStemmer;
  private static tfidf = new natural.TfIdf();

  // Technical domain keywords for different patent categories
  private static technicalKeywords = {
    software: [
      'algorithm', 'software', 'application', 'system', 'method', 'process',
      'data', 'database', 'network', 'interface', 'user', 'device', 'computer',
      'program', 'code', 'function', 'module', 'component', 'service', 'api',
      'framework', 'architecture', 'protocol', 'encryption', 'authentication'
    ],
    hardware: [
      'circuit', 'processor', 'memory', 'sensor', 'actuator', 'controller',
      'device', 'component', 'assembly', 'mechanism', 'apparatus', 'system',
      'hardware', 'electronic', 'electrical', 'mechanical', 'physical',
      'integrated', 'semiconductor', 'microcontroller', 'microprocessor'
    ],
    biotechnology: [
      'protein', 'gene', 'dna', 'rna', 'cell', 'tissue', 'organism',
      'enzyme', 'antibody', 'vaccine', 'drug', 'compound', 'molecule',
      'biological', 'biochemical', 'pharmaceutical', 'therapeutic',
      'diagnostic', 'treatment', 'disease', 'pathogen', 'bacteria'
    ],
    chemistry: [
      'chemical', 'compound', 'molecule', 'reaction', 'catalyst', 'solvent',
      'polymer', 'material', 'substance', 'composition', 'formula', 'synthesis',
      'organic', 'inorganic', 'analytical', 'chromatography', 'spectroscopy',
      'crystallization', 'purification', 'extraction', 'separation'
    ],
    mechanical: [
      'mechanism', 'assembly', 'component', 'part', 'structure', 'system',
      'machine', 'apparatus', 'device', 'equipment', 'tool', 'instrument',
      'mechanical', 'physical', 'structural', 'kinematic', 'dynamic',
      'force', 'motion', 'energy', 'power', 'transmission'
    ]
  };

  // Patent-specific patterns for extraction
  private static patterns = {
    title: /(?:title|invention):\s*([^\n]+)/i,
    inventors: /(?:inventors?|invented by):\s*([^\n]+)/gi,
    assignee: /(?:assignee|assigned to|owner):\s*([^\n]+)/i,
    filingDate: /(?:filing date|filed):\s*([^\n]+)/i,
    publicationDate: /(?:publication date|published):\s*([^\n]+)/i,
    abstract: /(?:abstract|summary):\s*([^\n]+)/i,
    claims: /(?:claim|claims)\s*\d+[:\s]*([^\n]+)/gi
  };

  static async extractPatentData(text: string): Promise<PatentData> {
    const cleanedText = this.cleanText(text);
    
    // Extract basic information using regex patterns
    const title = this.extractTitle(cleanedText);
    const inventors = this.extractInventors(cleanedText);
    const assignee = this.extractAssignee(cleanedText);
    const filingDate = this.extractFilingDate(cleanedText);
    const publicationDate = this.extractPublicationDate(cleanedText);
    const abstract = this.extractAbstract(cleanedText);
    const claims = this.extractClaims(cleanedText);
    const description = this.extractDescription(cleanedText);

    // Generate unique ID
    const id = this.generatePatentId(title, inventors[0]);

    // Extract technical terms
    const technicalTerms = this.extractTechnicalTerms(description);

    // Calculate initial scores
    const noveltyScore = this.calculateNoveltyScore(description, claims);
    const priorArtSimilarity = this.calculatePriorArtSimilarity(description);
    const claimStrength = this.calculateClaimStrength(claims);

    return {
      id,
      title,
      abstract,
      claims,
      description,
      inventors,
      assignee,
      filingDate,
      publicationDate,
      classification: [],
      technicalTerms,
      noveltyScore,
      priorArtSimilarity,
      claimStrength
    };
  }

  static async extractTechnicalTerms(text: string): Promise<string[]> {
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    const stemmedTokens = tokens.map(token => this.stemmer.stem(token));
    
    // Remove common words and short tokens
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    const filteredTokens = tokens.filter(token => 
      token.length > 3 && !stopWords.has(token)
    );

    // Extract technical terms based on frequency and domain keywords
    const termFrequency: { [key: string]: number } = {};
    filteredTokens.forEach(token => {
      termFrequency[token] = (termFrequency[token] || 0) + 1;
    });

    // Combine with domain-specific technical keywords
    const allTechnicalKeywords = Object.values(this.technicalKeywords).flat();
    const technicalTerms = new Set<string>();

    // Add high-frequency terms
    Object.entries(termFrequency)
      .filter(([term, freq]) => freq > 2)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .forEach(([term]) => technicalTerms.add(term));

    // Add domain-specific terms found in text
    allTechnicalKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        technicalTerms.add(keyword);
      }
    });

    return Array.from(technicalTerms);
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-.,;:()]/g, '')
      .trim();
  }

  private static extractTitle(text: string): string {
    const match = text.match(this.patterns.title);
    return match ? match[1].trim() : 'Untitled Patent';
  }

  private static extractInventors(text: string): string[] {
    const inventors: string[] = [];
    let match;
    const regex = new RegExp(this.patterns.inventors.source, 'gi');
    
    while ((match = regex.exec(text)) !== null) {
      inventors.push(match[1].trim());
    }
    
    return inventors.length > 0 ? inventors : ['Unknown Inventor'];
  }

  private static extractAssignee(text: string): string {
    const match = text.match(this.patterns.assignee);
    return match ? match[1].trim() : 'Unknown Assignee';
  }

  private static extractFilingDate(text: string): string {
    const match = text.match(this.patterns.filingDate);
    return match ? match[1].trim() : 'Unknown Filing Date';
  }

  private static extractPublicationDate(text: string): string {
    const match = text.match(this.patterns.publicationDate);
    return match ? match[1].trim() : 'Unknown Publication Date';
  }

  private static extractAbstract(text: string): string {
    const match = text.match(this.patterns.abstract);
    return match ? match[1].trim() : 'No abstract available';
  }

  private static extractClaims(text: string): string[] {
    const claims: string[] = [];
    let match;
    const regex = new RegExp(this.patterns.claims.source, 'gi');
    
    while ((match = regex.exec(text)) !== null) {
      claims.push(match[1].trim());
    }
    
    return claims.length > 0 ? claims : ['No claims found'];
  }

  private static extractDescription(text: string): string {
    // Extract the main description by removing headers and claims
    const lines = text.split('\n');
    const descriptionLines: string[] = [];
    let inDescription = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('description') || line.toLowerCase().includes('detailed description')) {
        inDescription = true;
        continue;
      }
      
      if (line.toLowerCase().includes('claims') || line.toLowerCase().includes('what is claimed')) {
        break;
      }
      
      if (inDescription && line.trim()) {
        descriptionLines.push(line);
      }
    }
    
    return descriptionLines.join(' ') || text;
  }

  private static generatePatentId(title: string, inventor: string): string {
    const titleHash = title.replace(/\s+/g, '').substring(0, 8).toUpperCase();
    const inventorHash = inventor.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const timestamp = Date.now().toString(36);
    return `PAT-${titleHash}-${inventorHash}-${timestamp}`;
  }

  private static calculateNoveltyScore(description: string, claims: string[]): number {
    // Analyze novelty based on unique technical terms and claim specificity
    const technicalTerms = this.extractTechnicalTerms(description);
    const uniqueTerms = new Set(technicalTerms);
    
    // Calculate novelty based on:
    // 1. Number of unique technical terms
    // 2. Claim specificity (longer, more detailed claims = higher novelty)
    // 3. Technical complexity
    
    const termNovelty = Math.min(uniqueTerms.size / 50, 1); // Normalize to 0-1
    const claimSpecificity = Math.min(claims.reduce((sum, claim) => sum + claim.length, 0) / 1000, 1);
    const technicalComplexity = Math.min(description.length / 5000, 1);
    
    return (termNovelty * 0.4 + claimSpecificity * 0.4 + technicalComplexity * 0.2);
  }

  private static calculatePriorArtSimilarity(description: string): number {
    // Simulate prior art similarity analysis
    // In a real implementation, this would compare against a database of existing patents
    
    const commonPhrases = [
      'method for', 'system for', 'apparatus for', 'device for',
      'process of', 'composition of', 'assembly for', 'mechanism for'
    ];
    
    let similarityScore = 0;
    commonPhrases.forEach(phrase => {
      if (description.toLowerCase().includes(phrase)) {
        similarityScore += 0.1;
      }
    });
    
    // Add randomness to simulate real analysis
    return Math.min(similarityScore + Math.random() * 0.3, 1);
  }

  private static calculateClaimStrength(claims: string[]): number {
    // Analyze claim strength based on:
    // 1. Claim specificity and detail
    // 2. Number of dependent claims
    // 3. Technical depth
    
    if (claims.length === 0) return 0;
    
    const avgClaimLength = claims.reduce((sum, claim) => sum + claim.length, 0) / claims.length;
    const claimSpecificity = Math.min(avgClaimLength / 200, 1);
    const claimCount = Math.min(claims.length / 10, 1);
    
    // Check for technical terms in claims
    const technicalTermsInClaims = claims.some(claim => 
      this.technicalKeywords.software.some(term => 
        claim.toLowerCase().includes(term)
      ) ||
      this.technicalKeywords.hardware.some(term => 
        claim.toLowerCase().includes(term)
      )
    );
    
    const technicalDepth = technicalTermsInClaims ? 0.8 : 0.3;
    
    return (claimSpecificity * 0.4 + claimCount * 0.3 + technicalDepth * 0.3);
  }

  // Advanced NLP methods for patent analysis
  static async performSentimentAnalysis(text: string): Promise<{
    positive: number;
    negative: number;
    neutral: number;
  }> {
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    
    const positiveWords = ['improved', 'enhanced', 'efficient', 'effective', 'superior', 'advanced', 'innovative'];
    const negativeWords = ['problem', 'issue', 'difficulty', 'limitation', 'drawback', 'disadvantage'];
    
    let positive = 0;
    let negative = 0;
    
    tokens.forEach(token => {
      if (positiveWords.includes(token)) positive++;
      if (negativeWords.includes(token)) negative++;
    });
    
    const total = tokens.length;
    const neutral = total - positive - negative;
    
    return {
      positive: positive / total,
      negative: negative / total,
      neutral: neutral / total
    };
  }

  static async extractKeyPhrases(text: string): Promise<string[]> {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPhrases: string[] = [];
    
    sentences.forEach(sentence => {
      const tokens = this.tokenizer.tokenize(sentence.toLowerCase()) || [];
      if (tokens.length > 5 && tokens.length < 15) {
        // Check if sentence contains technical terms
        const hasTechnicalTerms = tokens.some(token => 
          Object.values(this.technicalKeywords).flat().includes(token)
        );
        
        if (hasTechnicalTerms) {
          keyPhrases.push(sentence.trim());
        }
      }
    });
    
    return keyPhrases.slice(0, 10); // Return top 10 key phrases
  }

  static async calculateReadabilityScore(text: string): Promise<number> {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.tokenizer.tokenize(text) || [];
    const syllables = this.countSyllables(text);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch Reading Ease formula
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    return Math.max(0, Math.min(100, fleschScore)) / 100; // Normalize to 0-1
  }

  private static countSyllables(text: string): number {
    const words = this.tokenizer.tokenize(text.toLowerCase()) || [];
    let syllableCount = 0;
    
    words.forEach(word => {
      // Simple syllable counting algorithm
      const vowels = word.match(/[aeiouy]+/g);
      if (vowels) {
        syllableCount += vowels.length;
      } else {
        syllableCount += 1; // At least one syllable per word
      }
    });
    
    return syllableCount;
  }
}