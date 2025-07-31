import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatentTextProcessor } from './PatentTextProcessor';
import { PatentClassifier } from './PatentClassifier';
import { PriorArtAnalyzer } from './PriorArtAnalyzer';
import { ClaimAnalyzer } from './ClaimAnalyzer';
import { InnovationScorer } from './InnovationScorer';
import { PatentLandscape } from './PatentLandscape';

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

interface AnalysisResult {
  patent: PatentData;
  analysis: {
    classification: string[];
    technicalTerms: string[];
    noveltyScore: number;
    priorArtSimilarity: number;
    claimStrength: number;
    innovationScore: number;
    landscapePosition: {
      x: number;
      y: number;
      cluster: string;
    };
    recommendations: string[];
  };
}

export const PatentAnalysisAI: React.FC = () => {
  const [currentPatent, setCurrentPatent] = useState<PatentData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'single' | 'batch' | 'landscape'>('single');

  const analysisSteps = [
    'Text Processing & Extraction',
    'Classification & Categorization',
    'Prior Art Analysis',
    'Claim Strength Assessment',
    'Innovation Scoring',
    'Landscape Positioning',
    'Recommendations Generation'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      processUploadedFile(file);
    }
  };

  const processUploadedFile = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisStep(0);

    try {
      const text = await file.text();
      const patentData = await PatentTextProcessor.extractPatentData(text);
      setCurrentPatent(patentData);
      
      // Start analysis pipeline
      await runAnalysisPipeline(patentData);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextInput = async () => {
    if (!textInput.trim()) return;

    setIsAnalyzing(true);
    setAnalysisStep(0);

    try {
      const patentData = await PatentTextProcessor.extractPatentData(textInput);
      setCurrentPatent(patentData);
      
      await runAnalysisPipeline(patentData);
    } catch (error) {
      console.error('Error processing text:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runAnalysisPipeline = async (patent: PatentData) => {
    const analysis: AnalysisResult['analysis'] = {
      classification: [],
      technicalTerms: [],
      noveltyScore: 0,
      priorArtSimilarity: 0,
      claimStrength: 0,
      innovationScore: 0,
      landscapePosition: { x: 0, y: 0, cluster: '' },
      recommendations: []
    };

    // Step 1: Text Processing & Extraction
    setAnalysisStep(1);
    analysis.technicalTerms = await PatentTextProcessor.extractTechnicalTerms(patent.description);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Classification & Categorization
    setAnalysisStep(2);
    analysis.classification = await PatentClassifier.classifyPatent(patent);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Prior Art Analysis
    setAnalysisStep(3);
    analysis.priorArtSimilarity = await PriorArtAnalyzer.analyzeSimilarity(patent);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Claim Strength Assessment
    setAnalysisStep(4);
    analysis.claimStrength = await ClaimAnalyzer.assessClaimStrength(patent.claims);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Innovation Scoring
    setAnalysisStep(5);
    analysis.innovationScore = await InnovationScorer.calculateInnovationScore(patent);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 6: Landscape Positioning
    setAnalysisStep(6);
    analysis.landscapePosition = await PatentLandscape.positionPatent(patent);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 7: Generate Recommendations
    setAnalysisStep(7);
    analysis.recommendations = generateRecommendations(analysis);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setAnalysisResult({ patent, analysis });
  };

  const generateRecommendations = (analysis: AnalysisResult['analysis']): string[] => {
    const recommendations: string[] = [];

    if (analysis.noveltyScore < 0.6) {
      recommendations.push('Consider strengthening novelty claims with more specific technical implementations');
    }

    if (analysis.priorArtSimilarity > 0.7) {
      recommendations.push('High similarity to prior art detected. Review and differentiate claims');
    }

    if (analysis.claimStrength < 0.5) {
      recommendations.push('Claims may be too broad. Consider narrowing scope for better enforceability');
    }

    if (analysis.innovationScore < 0.6) {
      recommendations.push('Innovation score suggests incremental improvement. Consider highlighting breakthrough aspects');
    }

    recommendations.push('Schedule patent attorney review for legal validation');
    recommendations.push('Consider international patent filing strategy');

    return recommendations;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            ABP Engineering Patent & Design AI
          </h1>
          <p className="text-xl text-gray-300">
            Advanced AI-powered patent analysis and NLP processing
          </p>
        </motion.div>

        {/* Analysis Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-center space-x-4">
            {['single', 'batch', 'landscape'].map((mode) => (
              <button
                key={mode}
                onClick={() => setAnalysisMode(mode as any)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  analysisMode === mode
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)} Analysis
              </button>
            ))}
          </div>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 mb-8"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* File Upload */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-cyan-400">Upload Patent Document</h3>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-300">Click to upload patent document</p>
                  <p className="text-sm text-gray-500 mt-2">PDF, TXT, DOC, DOCX supported</p>
                </label>
              </div>
            </div>

            {/* Text Input */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-cyan-400">Or Paste Patent Text</h3>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste patent text here..."
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none resize-none"
              />
              <button
                onClick={handleTextInput}
                disabled={!textInput.trim() || isAnalyzing}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Analyze Patent
              </button>
            </div>
          </div>
        </motion.div>

        {/* Analysis Progress */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800 rounded-xl p-6 mb-8"
            >
              <h3 className="text-xl font-semibold mb-4 text-cyan-400">Analysis Progress</h3>
              <div className="space-y-4">
                {analysisSteps.map((step, index) => (
                  <div key={step} className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      index < analysisStep
                        ? 'bg-green-500 text-white'
                        : index === analysisStep
                        ? 'bg-cyan-500 text-white animate-pulse'
                        : 'bg-gray-600 text-gray-400'
                    }`}>
                      {index < analysisStep ? '✓' : index + 1}
                    </div>
                    <span className={`${
                      index <= analysisStep ? 'text-white' : 'text-gray-500'
                    }`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Results */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Patent Information */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">Patent Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400">Title</p>
                    <p className="text-white font-semibold">{analysisResult.patent.title}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Inventors</p>
                    <p className="text-white">{analysisResult.patent.inventors.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Assignee</p>
                    <p className="text-white">{analysisResult.patent.assignee}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Filing Date</p>
                    <p className="text-white">{analysisResult.patent.filingDate}</p>
                  </div>
                </div>
              </div>

              {/* Analysis Scores */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">Analysis Scores</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400">
                      {(analysisResult.analysis.noveltyScore * 100).toFixed(0)}%
                    </div>
                    <p className="text-gray-400">Novelty Score</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">
                      {(analysisResult.analysis.claimStrength * 100).toFixed(0)}%
                    </div>
                    <p className="text-gray-400">Claim Strength</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {(analysisResult.analysis.innovationScore * 100).toFixed(0)}%
                    </div>
                    <p className="text-gray-400">Innovation Score</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">
                      {((1 - analysisResult.analysis.priorArtSimilarity) * 100).toFixed(0)}%
                    </div>
                    <p className="text-gray-400">Uniqueness</p>
                  </div>
                </div>
              </div>

              {/* Technical Analysis */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">Technical Analysis</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-blue-400">Classification</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.analysis.classification.map((cat, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-green-400">Technical Terms</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.analysis.technicalTerms.slice(0, 10).map((term, index) => (
                        <span key={index} className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">AI Recommendations</h3>
                <div className="space-y-3">
                  {analysisResult.analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};