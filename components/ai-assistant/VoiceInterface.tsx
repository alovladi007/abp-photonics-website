'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSecurityStore } from '../../store/securityStore';

interface VoiceInterfaceProps {
  onVoiceCommand?: (command: string) => void;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onVoiceCommand }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { isListening, isSpeaking, setVoiceState } = useSecurityStore();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true);
      synthRef.current = speechSynthesis;
      
      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setVoiceState(true, false);
      };
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        
        if (event.results[current].isFinal) {
          handleVoiceCommand(transcript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setVoiceState(false, false);
      };
      
      recognition.onend = () => {
        setVoiceState(false, false);
        setTranscript('');
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [setVoiceState]);

  const handleVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    
    // Process voice command
    const response = await processVoiceCommand(command.toLowerCase());
    
    // Speak response
    if (response) {
      speak(response);
    }
    
    // Call external handler if provided
    if (onVoiceCommand) {
      onVoiceCommand(command);
    }
    
    setIsProcessing(false);
  };

  const processVoiceCommand = async (command: string): Promise<string> => {
    // Simple command processing logic
    if (command.includes('start') && command.includes('assessment')) {
      return "Starting your security assessment. I'll guide you through a series of questions about your organization's current security posture.";
    }
    
    if (command.includes('help') || command.includes('what can you do')) {
      return "I can help you with security assessments, provide recommendations, and answer questions about cybersecurity best practices. Try saying 'start assessment' to begin.";
    }
    
    if (command.includes('recommendations') || command.includes('suggest')) {
      return "Based on your assessment, I can provide personalized security recommendations including firewall configuration, antivirus solutions, backup strategies, and compliance requirements.";
    }
    
    if (command.includes('firewall')) {
      return "Firewalls are your first line of defense against external threats. I recommend implementing a next-generation firewall with intrusion detection and prevention capabilities.";
    }
    
    if (command.includes('backup')) {
      return "Follow the 3-2-1 backup rule: 3 copies of your data, on 2 different media types, with 1 copy stored offsite. Automated daily backups are essential for business continuity.";
    }
    
    if (command.includes('password') || command.includes('authentication')) {
      return "Multi-factor authentication is crucial. Use strong, unique passwords and enable MFA on all critical systems. Consider implementing single sign-on for better security management.";
    }
    
    return "I understand you're asking about cybersecurity. Could you be more specific? I can help with assessments, recommendations, or specific security topics.";
  };

  const speak = (text: string) => {
    if (synthRef.current && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => {
        setVoiceState(false, true);
      };
      
      utterance.onend = () => {
        setVoiceState(false, false);
      };
      
      synthRef.current.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setVoiceState(false, false);
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-600">
        <p className="text-gray-400 text-sm">
          Voice interface not supported in this browser. Please use Chrome, Edge, or Safari for voice features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Controls */}
      <div className="flex justify-center space-x-4">
        {!isListening && !isSpeaking && (
          <motion.button
            onClick={startListening}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-full hover:from-teal-500 hover:to-blue-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl">🎤</span>
            <span className="font-semibold">Start Voice Command</span>
          </motion.button>
        )}

        {isListening && (
          <motion.button
            onClick={stopListening}
            className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-xl">🔴</span>
            <span className="font-semibold">Listening...</span>
          </motion.button>
        )}

        {isSpeaking && (
          <motion.button
            onClick={stopSpeaking}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <span className="text-xl">🔊</span>
            <span className="font-semibold">Speaking...</span>
          </motion.button>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-600"
        >
          <div className="flex items-start space-x-3">
            <span className="text-teal-400 text-sm font-semibold">You said:</span>
            <p className="text-white flex-1">{transcript}</p>
          </div>
        </motion.div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center space-x-2 text-gray-400"
        >
          <motion.div
            className="w-2 h-2 bg-teal-400 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-teal-400 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-teal-400 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
          <span className="ml-2 text-sm">Processing your request...</span>
        </motion.div>
      )}

      {/* Voice Commands Help */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-600">
        <h4 className="text-white font-semibold mb-2">Voice Commands:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
          <div>• "Start assessment"</div>
          <div>• "Show recommendations"</div>
          <div>• "Help with firewall"</div>
          <div>• "Backup strategies"</div>
          <div>• "What can you do?"</div>
          <div>• "Password security"</div>
        </div>
      </div>
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
