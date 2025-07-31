'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSecurityStore } from '../../store/securityStore';
import { AIAvatar } from './AIAvatar';
import { AssessmentWizard } from './AssessmentWizard';
import { RecommendationPanel } from './RecommendationPanel';
import { PDFGenerator } from './PDFGenerator';
import { VoiceInterface } from './VoiceInterface';

export const AISecurityAssistant: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    isListening, 
    isSpeaking,
    isLoading 
  } = useSecurityStore();

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('start') && lowerCommand.includes('assessment')) {
      setCurrentView('assessment');
    } else if (lowerCommand.includes('recommendations') || lowerCommand.includes('results')) {
      setCurrentView('recommendations');
    } else if (lowerCommand.includes('report') || lowerCommand.includes('pdf')) {
      setCurrentView('pdf-export');
    } else if (lowerCommand.includes('home') || lowerCommand.includes('welcome')) {
      setCurrentView('welcome');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'assessment':
        return <AssessmentWizard />;
      case 'recommendations':
        return <RecommendationPanel />;
      case 'pdf-export':
        return <PDFGenerator />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
            ABP AI Security Assistant
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Your intelligent cybersecurity companion powered by Aurora Borealis Photonics
          </p>
        </motion.header>

        {/* AI Avatar */}
        <div className="flex justify-center mb-8">
          <AIAvatar
            isListening={isListening}
            isSpeaking={isSpeaking}
            mood={isLoading ? 'thinking' : 'neutral'}
            onInteraction={() => {
              if (currentView === 'welcome') {
                setCurrentView('assessment');
              }
            }}
          />
        </div>

        {/* Voice Interface */}
        <div className="mb-12">
          <VoiceInterface onVoiceCommand={handleVoiceCommand} />
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-16 pt-8 border-t border-slate-700"
        >
          <p className="text-gray-400 text-sm">
            © 2025 Aurora Borealis Photonics - ABP Citadel InfoSec Division
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Powered by advanced AI and machine learning technologies
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

const WelcomeScreen: React.FC = () => {
  const { setCurrentView } = useSecurityStore();

  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-4xl font-bold mb-6">Welcome to Your Security Assessment</h2>
        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
          I'm your AI security assistant, ready to help you evaluate and improve your organization's 
          cybersecurity posture. Let's work together to identify vulnerabilities and create a 
          comprehensive security plan tailored to your needs.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="bg-slate-800/50 rounded-xl p-6 border border-slate-600 hover:border-teal-400 transition-colors"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-6"
      >
        <button
          onClick={() => setCurrentView('assessment')}
          className="px-12 py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-full hover:from-teal-500 hover:to-blue-600 font-semibold text-lg transition-colors transform hover:scale-105"
        >
          Start Security Assessment
        </button>
        
        <p className="text-gray-400 text-sm">
          The assessment takes approximately 5-10 minutes to complete
        </p>
      </motion.div>
    </div>
  );
};

const features = [
  {
    icon: '🔍',
    title: 'Comprehensive Analysis',
    description: 'Deep dive into your current security infrastructure, policies, and potential vulnerabilities.'
  },
  {
    icon: '🎯',
    title: 'Personalized Recommendations',
    description: 'Receive tailored security recommendations based on your industry, size, and specific needs.'
  },
  {
    icon: '📊',
    title: 'Detailed Reporting',
    description: 'Generate professional PDF reports with implementation roadmaps and cost analysis.'
  },
  {
    icon: '🎤',
    title: 'Voice Interaction',
    description: 'Interact naturally using voice commands for a more intuitive assessment experience.'
  },
  {
    icon: '⚡',
    title: 'Real-time Guidance',
    description: 'Get instant feedback and explanations as you progress through the assessment.'
  },
  {
    icon: '🔒',
    title: 'Enterprise Security',
    description: 'Built with enterprise-grade security standards and compliance requirements in mind.'
  }
];

export default AISecurityAssistant;
