import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PatentAI from './components/PatentAI';
import { useStore } from './store/useStore';
import { ThemeProvider } from './contexts/ThemeContext';
import SplashScreen from './components/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { theme } = useStore();

  useEffect(() => {
    // Show splash screen for 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeProvider>
      <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen key="splash" />
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PatentAI />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}

export default App;