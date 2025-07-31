import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as tf from '@tensorflow/tfjs';
import { PatentNLPEngine } from '../patent-ai/PatentNLPEngine';
import { PatentClassifier } from '../patent-ai/PatentClassifier';
import { PriorArtSearch } from '../patent-ai/PriorArtSearch';
import { PatentSimilarityEngine } from '../patent-ai/PatentSimilarityEngine';
import { usePatentStore } from '../../store/patentStore';

interface PatentAnalysisProps {
  className?: string;
}

interface AnalysisResult {
  classification: {
    primaryClass: string;
    confidence: number;
    subClasses: string[];
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
}

export const PatentAnalysisAI: React.FC<PatentAnalysisProps> = ({ className = '' }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [patentText, setPatentText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const {
    nlpEngine,
    classifier,
    priorArtSearch,
    similarityEngine,
    initializeModels,
    isLoading
  } = usePatentStore();

  // Initialize AI models
  useEffect(() => {
    const initModels = async () => {
      try {
        await initializeModels();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize patent analysis models:', error);
      }
    };

    initModels();
  }, [initializeModels]);

  // Handle file upload and text extraction
  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    
    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        const pdfParse = (await import('pdf-parse')).default;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdfParse(buffer);
        extractedText = data.text;
      } else if (file.type.includes('word')) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.type === 'text/plain') {
        extractedText = await file.text();
      }
      
      setPatentText(extractedText);
    } catch (error) {
      console.error('Error extracting text from file:', error);
    }
  }, []);

  // Main patent analysis function
  const analyzePatent = useCallback(async () => {
    if (!patentText.trim() || !isInitialized) return;
    
    setIsAnalyzing(true);
    
    try {
      // Step 1: NLP Processing
      const nlpResults = await nlpEngine.processPatentText(patentText);
      
      // Step 2: Patent Classification
      const classification = await classifier.classifyPatent(patentText);
      
      // Step 3: Prior Art Search
      const priorArt = await priorArtSearch.findSimilarPatents(patentText, {
        limit: 10,
        threshold: 0.7
      });
      
      // Step 4: Similarity Analysis
      const similarityScores = await similarityEngine.calculateSimilarity(
        patentText,
        priorArt.map(p => p.abstract)
      );
      
      // Step 5: Novelty Assessment
      const noveltyScore = calculateNoveltyScore(similarityScores, priorArt);
      
      // Step 6: Patentability Analysis
      const patentability = assessPatentability(nlpResults, classification, noveltyScore);
      
      const results: AnalysisResult = {
        classification: {
          primaryClass: classification.primaryClass,
          confidence: classification.confidence,
          subClasses: classification.subClasses
        },
        noveltyScore,
        priorArt: priorArt.map((art, index) => ({
          ...art,
          similarity: similarityScores[index]
        })),
        technicalConcepts: nlpResults.technicalConcepts,
        claims: nlpResults.claims,
        patentability
      };
      
      setAnalysisResults(results);
    } catch (error) {
      console.error('Patent analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [patentText, isInitialized, nlpEngine, classifier, priorArtSearch, similarityEngine]);

  // Calculate novelty score based on prior art similarity
  const calculateNoveltyScore = (similarities: number[], priorArt: any[]): number => {
    if (similarities.length === 0) return 0.9;
    
    const maxSimilarity = Math.max(...similarities);
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    
    // Higher similarity to existing patents = lower novelty
    const noveltyScore = Math.max(0, 1 - (maxSimilarity * 0.7 + avgSimilarity * 0.3));
    return Math.round(noveltyScore * 100) / 100;
  };

  // Assess patentability based on various factors
  const assessPatentability = (nlpResults: any, classification: any, noveltyScore: number) => {
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
  };

  return (
    <div className={`patent-analysis-ai bg-gray-900 rounded-xl p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          ABP Patent Analysis AI
        </h2>
        <p className="text-gray-400">
          Advanced AI-powered patent analysis with NLP and prior art detection
        </p>
      </div>

      {/* Initialization Status */}
      {!isInitialized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center space-x-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-blue-400">Initializing AI models...</span>
          </div>
        </motion.div>
      )}

      {/* File Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Upload Patent Document
        </label>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
            id="patent-upload"
          />
          <label htmlFor="patent-upload" className="cursor-pointer">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Drop patent files here or click to upload
            </div>
            <p className="text-sm text-gray-500">
              Supports PDF, Word documents, and text files
            </p>
          </label>
        </div>
        {uploadedFile && (
          <p className="mt-2 text-sm text-green-400">
            Uploaded: {uploadedFile.name}
          </p>
        )}
      </div>

      {/* Text Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Patent Text
        </label>
        <textarea
          value={patentText}
          onChange={(e) => setPatentText(e.target.value)}
          placeholder="Enter patent description, claims, or abstract..."
          className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Analysis Button */}
      <motion.button
        onClick={analyzePatent}
        disabled={!patentText.trim() || !isInitialized || isAnalyzing}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isAnalyzing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Analyzing Patent...</span>
          </div>
        ) : (
          'Analyze Patent'
        )}
      </motion.button>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysisResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 space-y-6"
          >
            {/* Classification Results */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Patent Classification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Primary Class</p>
                  <p className="text-white font-medium">{analysisResults.classification.primaryClass}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Confidence</p>
                  <p className="text-white font-medium">
                    {(analysisResults.classification.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              {analysisResults.classification.subClasses.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-400 mb-2">Sub-classifications</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.classification.subClasses.map((subClass, index) => (
                      <span key={index} className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-sm">
                        {subClass}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Novelty Score */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Novelty Assessment</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        analysisResults.noveltyScore > 0.7 ? 'bg-green-500' :
                        analysisResults.noveltyScore > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analysisResults.noveltyScore * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-white font-medium">
                  {(analysisResults.noveltyScore * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Prior Art */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Prior Art Analysis ({analysisResults.priorArt.length} found)
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analysisResults.priorArt.map((art, index) => (
                  <div key={index} className="bg-gray-700 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-white text-sm">{art.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        art.similarity > 0.8 ? 'bg-red-900 text-red-300' :
                        art.similarity > 0.6 ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {(art.similarity * 100).toFixed(1)}% similar
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">Patent: {art.patentNumber}</p>
                    <p className="text-sm text-gray-300 line-clamp-2">{art.abstract}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Concepts */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Technical Concepts</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResults.technicalConcepts.map((concept, index) => (
                  <span key={index} className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full text-sm">
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            {/* Patentability Assessment */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Patentability Assessment</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Overall Score</span>
                  <span className="text-white font-medium">
                    {(analysisResults.patentability.score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analysisResults.patentability.score > 0.7 ? 'bg-green-500' :
                      analysisResults.patentability.score > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${analysisResults.patentability.score * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Positive Factors</h4>
                  <ul className="space-y-1">
                    {analysisResults.patentability.factors.map((factor, index) => (
                      <li key={index} className="text-sm text-green-400 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {analysisResults.patentability.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {analysisResults.patentability.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-yellow-400 flex items-start">
                          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};