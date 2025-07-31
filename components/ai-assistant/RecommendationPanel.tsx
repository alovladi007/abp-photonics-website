'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSecurityStore } from '../../store/securityStore';

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

const categoryIcons = {
  firewall: '🔥',
  antivirus: '🛡️',
  backup: '💾',
  mfa: '🔐',
  training: '🎓',
  compliance: '📋'
};

export const RecommendationPanel: React.FC = () => {
  const { 
    recommendations, 
    assessmentData, 
    toggleRecommendationComplete,
    setCurrentView 
  } = useSecurityStore();

  const completedCount = recommendations.filter(r => r.completed).length;
  const highPriorityCount = recommendations.filter(r => r.priority === 'high' && !r.completed).length;

  const estimateTotalCost = () => {
    // Simple cost estimation logic
    const costs = recommendations
      .filter(r => !r.completed)
      .map(r => {
        const match = r.estimatedCost.match(/\$(\d+(?:,\d+)?)/);
        return match ? parseInt(match[1].replace(',', '')) : 0;
      });
    
    const total = costs.reduce((sum, cost) => sum + cost, 0);
    return total.toLocaleString();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Security Assessment Results
        </h1>
        <p className="text-gray-300 text-lg">
          Personalized recommendations for {assessmentData.companyName || 'your organization'}
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 rounded-xl p-6 border border-slate-600"
        >
          <div className="text-3xl font-bold text-teal-400">{recommendations.length}</div>
          <div className="text-gray-300 text-sm">Total Recommendations</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-xl p-6 border border-slate-600"
        >
          <div className="text-3xl font-bold text-red-400">{highPriorityCount}</div>
          <div className="text-gray-300 text-sm">High Priority Items</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 rounded-xl p-6 border border-slate-600"
        >
          <div className="text-3xl font-bold text-green-400">{completedCount}</div>
          <div className="text-gray-300 text-sm">Completed</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 rounded-xl p-6 border border-slate-600"
        >
          <div className="text-3xl font-bold text-blue-400">${estimateTotalCost()}</div>
          <div className="text-gray-300 text-sm">Est. Investment</div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-slate-800/50 rounded-xl p-6 border border-slate-600"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Implementation Progress</h3>
          <span className="text-teal-400 font-semibold">
            {Math.round((completedCount / recommendations.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-teal-400 to-blue-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / recommendations.length) * 100}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Recommendations List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Security Recommendations</h2>
          <button
            onClick={() => setCurrentView('pdf-export')}
            className="px-6 py-2 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 font-semibold transition-colors"
          >
            Export PDF Report
          </button>
        </div>

        {recommendations.map((recommendation, index) => (
          <motion.div
            key={recommendation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className={`bg-slate-800/50 rounded-xl p-6 border border-slate-600 ${
              recommendation.completed ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{categoryIcons[recommendation.category]}</span>
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-xl font-semibold ${
                      recommendation.completed ? 'text-gray-400 line-through' : 'text-white'
                    }`}>
                      {recommendation.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${
                      priorityColors[recommendation.priority]
                    }`}>
                      {recommendation.priority.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p className="text-gray-300 mb-4 leading-relaxed">
                  {recommendation.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">💰 Cost:</span>
                    <span className="text-teal-400 font-semibold">{recommendation.estimatedCost}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">⏱️ Time:</span>
                    <span className="text-blue-400 font-semibold">{recommendation.timeToImplement}</span>
                  </div>
                </div>
              </div>

              <div className="ml-6">
                <button
                  onClick={() => toggleRecommendationComplete(recommendation.id)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    recommendation.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-400 hover:border-teal-400'
                  }`}
                >
                  {recommendation.completed && '✓'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex justify-center space-x-4 pt-8"
      >
        <button
          onClick={() => setCurrentView('assessment')}
          className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Retake Assessment
        </button>
        <button
          onClick={() => setCurrentView('pdf-export')}
          className="px-8 py-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 font-semibold transition-colors"
        >
          Generate Full Report
        </button>
      </motion.div>
    </div>
  );
};
