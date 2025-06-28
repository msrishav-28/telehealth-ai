'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, CloudOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    // Check initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setIsOnline(true);
      setShowOfflineMessage(false);
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {showOfflineMessage && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <WifiOff className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  You're offline
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Some features may not be available. Check your connection.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Retry
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
      
      {/* Connection status indicator */}
      <div className="fixed bottom-4 right-4 z-40">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`p-2 rounded-full ${
            isOnline 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-600' 
              : 'bg-red-100 dark:bg-red-900/20 text-red-600'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        >
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <CloudOff className="h-4 w-4" />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}