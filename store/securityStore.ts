import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'firewall' | 'antivirus' | 'backup' | 'mfa' | 'training' | 'compliance';
  estimatedCost: string;
  timeToImplement: string;
  completed: boolean;
}

interface AssessmentData {
  companyName?: string;
  industry?: string;
  companySize?: string;
  hasFirewall?: boolean;
  antivirusSolution?: string;
  backupFrequency?: string;
  mfaEnabled?: boolean;
  biggestThreats?: string;
  complianceRequirements?: string;
  securityBudget?: string;
}

interface SecurityStore {
  // Assessment state
  assessmentData: AssessmentData;
  isAssessmentComplete: boolean;
  
  // Recommendations
  recommendations: SecurityRecommendation[];
  
  // UI state
  currentView: 'welcome' | 'assessment' | 'recommendations' | 'pdf-export';
  isLoading: boolean;
  
  // Voice state
  isListening: boolean;
  isSpeaking: boolean;
  
  // Actions
  updateAssessment: (data: Partial<AssessmentData>) => void;
  generateRecommendations: (assessmentData: AssessmentData) => void;
  toggleRecommendationComplete: (id: string) => void;
  setCurrentView: (view: SecurityStore['currentView']) => void;
  setLoading: (loading: boolean) => void;
  setVoiceState: (listening: boolean, speaking: boolean) => void;
  resetAssessment: () => void;
}

const generateSecurityRecommendations = (data: AssessmentData): SecurityRecommendation[] => {
  const recommendations: SecurityRecommendation[] = [];

  // Firewall recommendations
  if (!data.hasFirewall) {
    recommendations.push({
      id: 'firewall-basic',
      title: 'Implement Network Firewall',
      description: 'Deploy a next-generation firewall to protect your network perimeter from external threats.',
      priority: 'high',
      category: 'firewall',
      estimatedCost: '$2,000 - $10,000',
      timeToImplement: '1-2 weeks',
      completed: false
    });
  }

  // Antivirus recommendations
  if (data.antivirusSolution === 'None' || data.antivirusSolution === 'Windows Defender') {
    recommendations.push({
      id: 'antivirus-enterprise',
      title: 'Upgrade to Enterprise Antivirus',
      description: 'Deploy enterprise-grade endpoint protection with advanced threat detection and response capabilities.',
      priority: 'high',
      category: 'antivirus',
      estimatedCost: '$30 - $100 per endpoint/year',
      timeToImplement: '3-5 days',
      completed: false
    });
  }

  // Backup recommendations
  if (data.backupFrequency === 'Never' || data.backupFrequency === 'Rarely') {
    recommendations.push({
      id: 'backup-strategy',
      title: 'Implement 3-2-1 Backup Strategy',
      description: 'Establish automated daily backups with 3 copies, 2 different media types, and 1 offsite location.',
      priority: 'high',
      category: 'backup',
      estimatedCost: '$500 - $5,000/month',
      timeToImplement: '1-2 weeks',
      completed: false
    });
  }

  // MFA recommendations
  if (!data.mfaEnabled) {
    recommendations.push({
      id: 'mfa-implementation',
      title: 'Enable Multi-Factor Authentication',
      description: 'Implement MFA across all critical systems and user accounts to prevent unauthorized access.',
      priority: 'high',
      category: 'mfa',
      estimatedCost: '$3 - $10 per user/month',
      timeToImplement: '1 week',
      completed: false
    });
  }

  // Industry-specific recommendations
  if (data.industry === 'Healthcare' && !data.complianceRequirements?.includes('HIPAA')) {
    recommendations.push({
      id: 'hipaa-compliance',
      title: 'HIPAA Compliance Assessment',
      description: 'Conduct comprehensive HIPAA compliance review and implement required security controls.',
      priority: 'high',
      category: 'compliance',
      estimatedCost: '$10,000 - $50,000',
      timeToImplement: '2-3 months',
      completed: false
    });
  }

  if (data.industry === 'Finance & Banking' && !data.complianceRequirements?.includes('PCI DSS')) {
    recommendations.push({
      id: 'pci-compliance',
      title: 'PCI DSS Compliance',
      description: 'Implement PCI DSS requirements for secure payment card data handling and processing.',
      priority: 'high',
      category: 'compliance',
      estimatedCost: '$15,000 - $75,000',
      timeToImplement: '3-6 months',
      completed: false
    });
  }

  // Security training
  recommendations.push({
    id: 'security-training',
    title: 'Employee Security Awareness Training',
    description: 'Implement regular security awareness training to reduce human-factor security risks.',
    priority: 'medium',
    category: 'training',
    estimatedCost: '$20 - $50 per employee/year',
    timeToImplement: '2-4 weeks',
    completed: false
  });

  // Threat-specific recommendations
  if (data.biggestThreats?.includes('Ransomware')) {
    recommendations.push({
      id: 'ransomware-protection',
      title: 'Advanced Ransomware Protection',
      description: 'Deploy specialized anti-ransomware solutions with behavioral analysis and automated response.',
      priority: 'high',
      category: 'antivirus',
      estimatedCost: '$50 - $150 per endpoint/year',
      timeToImplement: '1-2 weeks',
      completed: false
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

export const useSecurityStore = create<SecurityStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      assessmentData: {},
      isAssessmentComplete: false,
      recommendations: [],
      currentView: 'welcome',
      isLoading: false,
      isListening: false,
      isSpeaking: false,

      // Actions
      updateAssessment: (data) =>
        set((state) => ({
          assessmentData: { ...state.assessmentData, ...data }
        })),

      generateRecommendations: (assessmentData) => {
        set({ isLoading: true });
        
        // Simulate API call delay
        setTimeout(() => {
          const recommendations = generateSecurityRecommendations(assessmentData);
          set({
            recommendations,
            isAssessmentComplete: true,
            currentView: 'recommendations',
            isLoading: false
          });
        }, 2000);
      },

      toggleRecommendationComplete: (id) =>
        set((state) => ({
          recommendations: state.recommendations.map((rec) =>
            rec.id === id ? { ...rec, completed: !rec.completed } : rec
          )
        })),

      setCurrentView: (view) => set({ currentView: view }),

      setLoading: (loading) => set({ isLoading: loading }),

      setVoiceState: (listening, speaking) =>
        set({ isListening: listening, isSpeaking: speaking }),

      resetAssessment: () =>
        set({
          assessmentData: {},
          isAssessmentComplete: false,
          recommendations: [],
          currentView: 'welcome',
          isLoading: false,
          isListening: false,
          isSpeaking: false
        })
    }),
    {
      name: 'security-store'
    }
  )
);
