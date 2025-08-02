import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // User preferences
      preferences: {
        autoSave: true,
        notifications: true,
        language: 'en',
        fontSize: 'medium',
        compactMode: false,
      },
      updatePreferences: (prefs) => set((state) => ({ 
        preferences: { ...state.preferences, ...prefs } 
      })),

      // Active tab
      activeTab: 'chat',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Chat state
      chatHistory: [
        { 
          id: '1',
          role: 'assistant', 
          content: 'Welcome to PatentPro AI! I can help you with patent searches, application guidance, claim drafting, status tracking, and more. How can I assist you today?',
          timestamp: new Date().toISOString()
        }
      ],
      addChatMessage: (message) => set((state) => ({
        chatHistory: [...state.chatHistory, {
          id: Date.now().toString(),
          ...message,
          timestamp: new Date().toISOString()
        }]
      })),
      clearChatHistory: () => set({ 
        chatHistory: [{
          id: '1',
          role: 'assistant',
          content: 'Chat history cleared. How can I help you today?',
          timestamp: new Date().toISOString()
        }] 
      }),

      // Patent search state
      searchHistory: [],
      savedSearches: [],
      addSearchToHistory: (search) => set((state) => ({
        searchHistory: [search, ...state.searchHistory.slice(0, 49)]
      })),
      saveSearch: (search) => set((state) => ({
        savedSearches: [...state.savedSearches, { ...search, id: Date.now().toString() }]
      })),
      removeSavedSearch: (id) => set((state) => ({
        savedSearches: state.savedSearches.filter(s => s.id !== id)
      })),

      // Application drafts
      applicationDrafts: [],
      currentDraft: null,
      createDraft: (draft) => {
        const newDraft = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...draft
        };
        set((state) => ({
          applicationDrafts: [...state.applicationDrafts, newDraft],
          currentDraft: newDraft
        }));
        return newDraft;
      },
      updateDraft: (id, updates) => set((state) => ({
        applicationDrafts: state.applicationDrafts.map(d => 
          d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
        ),
        currentDraft: state.currentDraft?.id === id 
          ? { ...state.currentDraft, ...updates, updatedAt: new Date().toISOString() }
          : state.currentDraft
      })),
      deleteDraft: (id) => set((state) => ({
        applicationDrafts: state.applicationDrafts.filter(d => d.id !== id),
        currentDraft: state.currentDraft?.id === id ? null : state.currentDraft
      })),
      setCurrentDraft: (draft) => set({ currentDraft: draft }),

      // Claims drafts
      claimsDrafts: [],
      saveClaimDraft: (claim) => set((state) => ({
        claimsDrafts: [...state.claimsDrafts, {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          ...claim
        }]
      })),

      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification
        }]
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      })),
      clearNotifications: () => set({ notifications: [] }),

      // AI Models
      activeModel: 'patent-gpt-pro',
      availableModels: [
        { id: 'patent-gpt-pro', name: 'PatentGPT Pro', description: 'Advanced model specialized in patent law and technical analysis' },
        { id: 'patent-gpt-lite', name: 'PatentGPT Lite', description: 'Streamlined model for basic patent assistance' },
        { id: 'legal-expert', name: 'Legal Expert', description: 'Focused on legal aspects of patent applications' },
        { id: 'technical-analyzer', name: 'Technical Analyzer', description: 'Specialized in technical assessment of inventions' }
      ],
      setActiveModel: (modelId) => set({ activeModel: modelId }),

      // Timeline events
      timelineEvents: [],
      addTimelineEvent: (event) => set((state) => ({
        timelineEvents: [...state.timelineEvents, {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          ...event
        }]
      })),

      // Cost estimates
      savedEstimates: [],
      saveEstimate: (estimate) => set((state) => ({
        savedEstimates: [...state.savedEstimates, {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          ...estimate
        }]
      })),

      // International filing plans
      filingPlans: [],
      saveFilingPlan: (plan) => set((state) => ({
        filingPlans: [...state.filingPlans, {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          ...plan
        }]
      })),

      // Analytics data
      analytics: {
        totalSearches: 0,
        totalApplications: 0,
        totalClaims: 0,
        averageResponseTime: 0,
      },
      updateAnalytics: (data) => set((state) => ({
        analytics: { ...state.analytics, ...data }
      })),

      // Session management
      sessionStartTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      updateLastActivity: () => set({ lastActivity: new Date().toISOString() }),

      // Feature flags
      features: {
        advancedSearch: true,
        collaborationMode: false,
        exportFeatures: true,
        voiceInput: false,
        aiSuggestions: true,
      },
      toggleFeature: (feature) => set((state) => ({
        features: { ...state.features, [feature]: !state.features[feature] }
      })),
    }),
    {
      name: 'patent-ai-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        preferences: state.preferences,
        savedSearches: state.savedSearches,
        applicationDrafts: state.applicationDrafts,
        claimsDrafts: state.claimsDrafts,
        savedEstimates: state.savedEstimates,
        filingPlans: state.filingPlans,
        features: state.features,
      }),
    }
  )
);