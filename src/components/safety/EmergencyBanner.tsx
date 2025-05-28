'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmergencyBannerProps {
  onClose: () => void;
}

export function EmergencyBanner({ onClose }: EmergencyBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-0 left-0 right-0 z-50 p-4"
    >
      <Card className="max-w-4xl mx-auto p-4 bg-red-50 dark:bg-red-950/90 border-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Emergency Medical Attention May Be Needed
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                Based on your message, you may need immediate medical care. Please call emergency services.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => window.location.href = 'tel:911'}
          >
            <Phone className="h-4 w-4" />
            Call 911 (US)
          </Button>
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Find Nearest ER
          </Button>
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Crisis Hotline: 988
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}