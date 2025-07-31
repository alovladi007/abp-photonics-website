'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AIAvatarProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  mood?: 'neutral' | 'thinking' | 'analyzing' | 'alert';
  onInteraction?: () => void;
}

export const AIAvatar: React.FC<AIAvatarProps> = ({
  isListening = false,
  isSpeaking = false,
  mood = 'neutral',
  onInteraction
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        setMousePosition({
          x: (e.clientX - centerX) * 0.1,
          y: (e.clientY - centerY) * 0.1
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getMoodColor = () => {
    switch (mood) {
      case 'thinking': return '#3b82f6';
      case 'analyzing': return '#f59e0b';
      case 'alert': return '#ef4444';
      default: return '#64ffda';
    }
  };

  const pulseVariants = {
    idle: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    listening: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    speaking: {
      scale: [1, 1.15, 1.05, 1.1, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Container */}
      <motion.div
        ref={avatarRef}
        className="relative w-32 h-32 cursor-pointer"
        onClick={onInteraction}
        animate={isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle'}
        variants={pulseVariants}
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
        }}
      >
        {/* Outer Glow Ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${getMoodColor()}20 0%, transparent 70%)`
          }}
          animate={{
            scale: isListening ? [1, 1.3, 1] : [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Main Avatar Circle */}
        <motion.div
          className="relative w-full h-full rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${getMoodColor()}, ${getMoodColor()}80)`,
            boxShadow: `0 0 30px ${getMoodColor()}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* AI Icon/Face */}
          <motion.div
            animate={{
              rotate: isSpeaking ? [0, 5, -5, 0] : 0
            }}
            transition={{
              duration: 0.5,
              repeat: isSpeaking ? Infinity : 0
            }}
          >
            🤖
          </motion.div>

          {/* Voice Indicator */}
          {isSpeaking && (
            <motion.div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white rounded-full"
                    animate={{
                      height: [4, 12, 4],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Listening Indicator */}
          {isListening && (
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🎤
            </motion.div>
          )}
        </motion.div>

        {/* Particle Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: getMoodColor(),
                left: `${20 + i * 10}%`,
                top: `${20 + (i % 2) * 60}%`
              }}
              animate={{
                y: [-10, -20, -10],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Status Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm font-medium text-gray-300">
          {isSpeaking ? 'Speaking...' : 
           isListening ? 'Listening...' : 
           mood === 'thinking' ? 'Analyzing...' :
           mood === 'alert' ? 'Security Alert' :
           'Ready to assist'}
        </p>
      </motion.div>
    </div>
  );
};
