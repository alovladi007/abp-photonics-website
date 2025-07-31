'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSecurityStore } from '../../store/securityStore';

interface Step {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'number' | 'boolean';
  options?: string[];
  required: boolean;
}

const assessmentSteps: Step[] = [
  {
    id: 'company-info',
    title: 'Company Information',
    description: 'Tell us about your organization',
    questions: [
      {
        id: 'company-name',
        text: 'What is your company name?',
        type: 'text',
        required: true
      },
      {
        id: 'industry',
        text: 'What industry are you in?',
        type: 'multiple-choice',
        options: ['Finance & Banking', 'Healthcare', 'Technology', 'Retail & E-commerce', 'Manufacturing', 'Education', 'Government', 'Other'],
        required: true
      },
      {
        id: 'company-size',
        text: 'How many employees does your company have?',
        type: 'multiple-choice',
        options: ['1-10', '11-50', '51-200', '201-500', '501+'],
        required: true
      }
    ]
  },
  {
    id: 'current-security',
    title: 'Current Security Posture',
    description: 'Help us understand your existing security measures',
    questions: [
      {
        id: 'has-firewall',
        text: 'Do you currently have a firewall in place?',
        type: 'boolean',
        required: true
      },
      {
        id: 'antivirus-solution',
        text: 'What antivirus/anti-malware solution do you use?',
        type: 'multiple-choice',
        options: ['Windows Defender', 'Norton', 'McAfee', 'Bitdefender', 'Kaspersky', 'CrowdStrike', 'Other', 'None'],
        required: true
      },
      {
        id: 'backup-frequency',
        text: 'How often do you backup your data?',
        type: 'multiple-choice',
        options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'],
        required: true
      },
      {
        id: 'mfa-enabled',
        text: 'Do you use multi-factor authentication (MFA)?',
        type: 'boolean',
        required: true
      }
    ]
  },
  {
    id: 'security-concerns',
    title: 'Security Concerns & Priorities',
    description: 'What are your main security concerns?',
    questions: [
      {
        id: 'biggest-threats',
        text: 'What do you consider your biggest security threats?',
        type: 'multiple-choice',
        options: ['Ransomware', 'Phishing attacks', 'Data breaches', 'Insider threats', 'DDoS attacks', 'Malware', 'Social engineering'],
        required: true
      },
      {
        id: 'compliance-requirements',
        text: 'Do you have specific compliance requirements?',
        type: 'multiple-choice',
        options: ['GDPR', 'HIPAA', 'PCI DSS', 'SOX', 'ISO 27001', 'NIST', 'None', 'Other'],
        required: false
      },
      {
        id: 'security-budget',
        text: 'What is your approximate annual security budget?',
        type: 'multiple-choice',
        options: ['Under $10K', '$10K-$50K', '$50K-$100K', '$100K-$500K', '$500K+', 'Not sure'],
        required: false
      }
    ]
  }
];

export const AssessmentWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const { updateAssessment, generateRecommendations } = useSecurityStore();

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    const currentStepData = assessmentSteps[currentStep];
    const requiredQuestions = currentStepData.questions.filter(q => q.required);
    const hasAllRequiredAnswers = requiredQuestions.every(q => answers[q.id]);

    if (!hasAllRequiredAnswers) {
      alert('Please answer all required questions before proceeding.');
      return;
    }

    if (currentStep < assessmentSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete assessment
      updateAssessment(answers);
      generateRecommendations(answers);
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-teal-400 focus:outline-none"
            placeholder="Enter your answer..."
          />
        );

      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="text-teal-400 focus:ring-teal-400"
                />
                <span className="text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={value === true}
                onChange={() => handleAnswer(question.id, true)}
                className="text-teal-400 focus:ring-teal-400"
              />
              <span className="text-gray-300">Yes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={value === false}
                onChange={() => handleAnswer(question.id, false)}
                className="text-teal-400 focus:ring-teal-400"
              />
              <span className="text-gray-300">No</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold text-white mb-4">Assessment Complete!</h2>
        <p className="text-gray-300 mb-8">
          Thank you for completing the security assessment. Your personalized security plan is being generated.
        </p>
        <motion.div
          className="inline-block"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full"></div>
        </motion.div>
      </motion.div>
    );
  }

  const currentStepData = assessmentSteps[currentStep];
  const progress = ((currentStep + 1) / assessmentSteps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Step {currentStep + 1} of {assessmentSteps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-800/50 rounded-xl p-8 border border-slate-600"
        >
          <h2 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h2>
          <p className="text-gray-400 mb-8">{currentStepData.description}</p>

          <div className="space-y-8">
            {currentStepData.questions.map((question) => (
              <div key={question.id} className="space-y-4">
                <label className="block text-lg font-medium text-white">
                  {question.text}
                  {question.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {renderQuestion(question)}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 font-semibold transition-colors"
        >
          {currentStep === assessmentSteps.length - 1 ? 'Complete Assessment' : 'Next'}
        </button>
      </div>
    </div>
  );
};
