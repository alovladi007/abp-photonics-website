import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import Header from './components/Header';
import Navigation from './components/Navigation';
import ChatAssistant from './components/ChatAssistant';
import PatentSearch from './components/PatentSearch';
import ApplicationDrafting from './components/ApplicationDrafting';
import ClaimsAssistant from './components/ClaimsAssistant';
import Timeline from './components/Timeline';
import CostEstimator from './components/CostEstimator';
import InternationalFiling from './components/InternationalFiling';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import NotificationCenter from './components/NotificationCenter';
import AIInsightsPanel from './components/AIInsightsPanel';
import DemoMode from './components/DemoMode';
import CollaborationPanel from './components/CollaborationPanel';
import ExportManager from './components/ExportManager';
import VoiceInput from './components/VoiceInput';
import KeyboardShortcuts from './components/KeyboardShortcuts';

// Hooks
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useOfflineSync } from '../../hooks/useOfflineSync';

// Services
import { patentAPI } from '../../services/patentAPI';
import { aiService } from '../../services/aiService';
import { analyticsService } from '../../services/analyticsService';

// Utils
import { cn } from '../../utils/cn';
import { debounce } from '../../utils/debounce';
import { validatePatentClaim } from '../../utils/validators';

const PatentAI = () => {
  const {
    activeTab,
    setActiveTab,
    preferences,
    features,
    notifications,
    activeModel,
    updateLastActivity,
  } = useStore();
  
  const { isDark } = useTheme();
  
  // Local state
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsightContent, setAIInsightContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDemoMode, setShowDemoMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExportManager, setShowExportManager] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs
  const mainContentRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  
  // WebSocket connection for real-time features
  const { sendMessage, connectionStatus } = useWebSocket({
    url: process.env.REACT_APP_WS_URL || 'ws://localhost:8080',
    onMessage: handleWebSocketMessage,
  });
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    'cmd+k': () => setSearchQuery(''),
    'cmd+/': () => toast('Keyboard shortcuts', { icon: '⌨️' }),
    'cmd+s': () => handleSave(),
    'cmd+e': () => setShowExportManager(true),
    'cmd+,': () => setShowSettings(true),
    'esc': () => handleEscape(),
  });
  
  // Auto-save functionality
  useAutoSave({
    enabled: preferences.autoSave,
    interval: 30000, // 30 seconds
    onSave: handleAutoSave,
  });
  
  // Offline sync
  useOfflineSync({
    onSync: handleOfflineSync,
  });
  
  // Activity tracking
  useEffect(() => {
    const handleActivity = debounce(() => {
      updateLastActivity();
      lastActivityRef.current = Date.now();
    }, 1000);
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateLastActivity]);
  
  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Analytics tracking
  useEffect(() => {
    analyticsService.trackPageView(activeTab);
  }, [activeTab]);
  
  // WebSocket message handler
  function handleWebSocketMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'ai_response':
        handleAIResponse(data);
        break;
      case 'collaboration_update':
        handleCollaborationUpdate(data);
        break;
      case 'notification':
        handleNotification(data);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }
  
  // Handlers
  const handleAIResponse = useCallback((data) => {
    setAIInsightContent(data.content);
    setShowAIInsights(true);
    
    if (data.suggestions) {
      toast.success('AI suggestions available', {
        icon: '✨',
        duration: 3000,
      });
    }
  }, []);
  
  const handleCollaborationUpdate = useCallback((data) => {
    // Handle real-time collaboration updates
    console.log('Collaboration update:', data);
  }, []);
  
  const handleNotification = useCallback((data) => {
    toast(data.message, {
      icon: data.icon || '📢',
      duration: data.duration || 4000,
    });
  }, []);
  
  const handleSave = useCallback(() => {
    // Save current work
    toast.success('Work saved successfully');
  }, []);
  
  const handleAutoSave = useCallback(() => {
    // Auto-save logic
    console.log('Auto-saving...');
  }, []);
  
  const handleOfflineSync = useCallback(() => {
    // Sync offline data
    console.log('Syncing offline data...');
  }, []);
  
  const handleEscape = useCallback(() => {
    // Close any open modals
    setShowSettings(false);
    setShowNotifications(false);
    setShowExportManager(false);
    setShowAIInsights(false);
  }, []);
  
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);
  
  // Tab content renderer
  const renderTabContent = () => {
    const contentProps = {
      onAIInsight: setAIInsightContent,
      showAIInsight: () => setShowAIInsights(true),
      isProcessing,
      setIsProcessing,
    };
    
    switch (activeTab) {
      case 'chat':
        return <ChatAssistant {...contentProps} />;
      case 'search':
        return <PatentSearch {...contentProps} />;
      case 'application':
        return <ApplicationDrafting {...contentProps} />;
      case 'claims':
        return <ClaimsAssistant {...contentProps} />;
      case 'timeline':
        return <Timeline {...contentProps} />;
      case 'costs':
        return <CostEstimator {...contentProps} />;
      case 'international':
        return <InternationalFiling {...contentProps} />;
      case 'analytics':
        return <Analytics {...contentProps} />;
      default:
        return <ChatAssistant {...contentProps} />;
    }
  };
  
  return (
    <div className={cn(
      'flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300',
      preferences.compactMode && 'compact-mode'
    )}>
      {/* Header */}
      <Header
        onToggleSettings={() => setShowSettings(!showSettings)}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        onToggleFullscreen={toggleFullscreen}
        onStartDemo={() => setShowDemoMode(true)}
        isFullscreen={isFullscreen}
        connectionStatus={connectionStatus}
      />
      
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Main Content Area */}
        <main 
          ref={mainContentRef}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        
        {/* Right Sidebar - AI Insights & Collaboration */}
        {(showAIInsights || features.collaborationMode) && (
          <aside className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
            {showAIInsights && (
              <AIInsightsPanel
                content={aiInsightContent}
                onClose={() => setShowAIInsights(false)}
                model={activeModel}
              />
            )}
            {features.collaborationMode && (
              <CollaborationPanel />
            )}
          </aside>
        )}
      </div>
      
      {/* Modals and Overlays */}
      <AnimatePresence>
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}
        {showNotifications && (
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        )}
        {showExportManager && (
          <ExportManager onClose={() => setShowExportManager(false)} />
        )}
        {showDemoMode && (
          <DemoMode onClose={() => setShowDemoMode(false)} />
        )}
      </AnimatePresence>
      
      {/* Voice Input (if enabled) */}
      {features.voiceInput && <VoiceInput />}
      
      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcuts />
      
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 dark:text-gray-300">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatentAI;