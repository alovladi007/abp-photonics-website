'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIAvatar } from './AIAvatar';
import { AssessmentWizard } from './AssessmentWizard';
import { RecommendationPanel } from './RecommendationPanel';
import { PDFGenerator } from './PDFGenerator';
import { VoiceInterface } from './VoiceInterface';
import { PatentAnalysisAI } from './PatentAnalysisAI';
import { useSecurityStore } from '../../store/securityStore';
import { usePatentStore } from '../../store/patentStore';

interface AIAssistantProps {
  className?: string;
}

type ActiveMode = 'security' | 'patents' | 'overview';

export const AIAssistant: React.FC<AIAssistantProps> = ({ className = '' }) => {
  const [activeMode, setActiveMode] = useState<ActiveMode>('overview');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Security store
  const securityStore = useSecurityStore();
  
  // Patent store
  const patentStore = usePatentStore();

  // Initialize both AI systems
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        // Initialize patent analysis system
        if (!patentStore.isInitialized) {
          await patentStore.initializeModels();
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize AI systems:', error);
      }
    };

    initializeSystems();
  }, [patentStore]);

  const modeButtons = [
    {
      id: 'overview' as ActiveMode,
      title: 'Overview',
      description: 'ABP AI System Overview',
      icon: '🏢',
      gradient: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'security' as ActiveMode,
      title: 'Security Analysis',
      description: 'Cybersecurity Assessment',
      icon: '🛡️',
      gradient: 'from-red-600 to-orange-600'
    },
    {
      id: 'patents' as ActiveMode,
      title: 'Patent Analysis',
      description: 'AI-Powered Patent & NLP Analysis',
      icon: '📋',
      gradient: 'from-purple-600 to-pink-600'
    }
  ];

  return (
    <div className={`ai-assistant min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">ABP</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Aurora Borealis Photonics AI
                </h1>
                <p className="text-gray-400">
                  Advanced AI Systems for Security & Patent Analysis
                </p>
              </div>
            </div>
            
            {/* Initialization Status */}
            <div className="flex items-center space-x-3">
              {isInitialized ? (
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">AI Systems Online</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Initializing AI...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {modeButtons.map((mode) => (
            <motion.button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                activeMode === mode.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${mode.gradient} flex items-center justify-center text-2xl`}>
                  {mode.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">{mode.title}</h3>
                  <p className="text-sm text-gray-400">{mode.description}</p>
                </div>
              </div>
              
              {activeMode === mode.id && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl"
                  layoutId="activeMode"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeMode === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Overview Dashboard */}
              <div className="bg-gray-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  ABP AI System Overview
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Security Division */}
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                        🛡️
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">ABP Citadel InfoSec</h3>
                        <p className="text-sm text-gray-400">Cybersecurity Assessment Division</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">AI Security Analysis</span>
                        <span className="text-green-400">✓ Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Voice Interface</span>
                        <span className="text-green-400">✓ Ready</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Report Generation</span>
                        <span className="text-green-400">✓ Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Patent Division */}
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        📋
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">ABP Engineering Patent & Design</h3>
                        <p className="text-sm text-gray-400">AI Patent Analysis Division</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">NLP Engine</span>
                        <span className={patentStore.isInitialized ? "text-green-400" : "text-yellow-400"}>
                          {patentStore.isInitialized ? "✓ Active" : "⏳ Loading"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Patent Classification</span>
                        <span className={patentStore.isInitialized ? "text-green-400" : "text-yellow-400"}>
                          {patentStore.isInitialized ? "✓ Ready" : "⏳ Loading"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Prior Art Search</span>
                        <span className={patentStore.isInitialized ? "text-green-400" : "text-yellow-400"}>
                          {patentStore.isInitialized ? "✓ Available" : "⏳ Loading"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/30">
                  <h3 className="text-xl font-semibold text-white mb-4">About Aurora Borealis Photonics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-blue-400 mb-2">Our Divisions</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li>• <strong>ABP Citadel InfoSec:</strong> Cybersecurity Solutions</li>
                        <li>• <strong>ABP Engineering:</strong> Patent & Design Services</li>
                        <li>• <strong>ABP Optoelectronics:</strong> Advanced Optical Systems</li>
                        <li>• <strong>BioTensor Lab:</strong> Biomedical AI Research</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-purple-400 mb-2">AI Capabilities</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li>• Advanced NLP & Text Analysis</li>
                        <li>• Machine Learning Classification</li>
                        <li>• Semantic Similarity Detection</li>
                        <li>• Automated Report Generation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeMode === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Security Analysis Interface */}
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                    🛡️
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">ABP Citadel InfoSec</h2>
                    <p className="text-gray-400">AI-Powered Cybersecurity Assessment</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* AI Avatar */}
                  <div className="lg:col-span-1">
                    <AIAvatar />
                  </div>

                  {/* Main Content */}
                  <div className="lg:col-span-2">
                    {!securityStore.currentStep ? (
                      <div className="text-center py-8">
                        <h3 className="text-xl font-semibold text-white mb-4">
                          Welcome to ABP Security Assessment
                        </h3>
                        <p className="text-gray-400 mb-6">
                          Let our AI analyze your organization's cybersecurity posture
                        </p>
                        <button
                          onClick={() => securityStore.startAssessment()}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          Start Security Assessment
                        </button>
                      </div>
                    ) : (
                      <AssessmentWizard />
                    )}
                  </div>
                </div>

                {/* Results Panel */}
                {securityStore.recommendations.length > 0 && (
                  <div className="mt-8">
                    <RecommendationPanel />
                  </div>
                )}
              </div>

              {/* Voice Interface */}
              <VoiceInterface />
            </motion.div>
          )}

          {activeMode === 'patents' && (
            <motion.div
              key="patents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Patent Analysis Interface */}
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    📋
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">ABP Engineering Patent & Design</h2>
                    <p className="text-gray-400">Advanced AI Patent Analysis & NLP Processing</p>
                  </div>
                </div>

                <PatentAnalysisAI />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              © 2025 Aurora Borealis Photonics - Advanced AI Technology Solutions
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Powered by TensorFlow.js & Advanced NLP</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
