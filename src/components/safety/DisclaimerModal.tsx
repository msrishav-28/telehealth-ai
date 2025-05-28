'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Shield, 
  Heart, 
  Phone,
  CheckCircle,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function DisclaimerModal({ isOpen, onAccept, onDecline }: DisclaimerModalProps) {
  const [acknowledged, setAcknowledged] = useState({
    notMedicalAdvice: false,
    seekProfessional: false,
    emergency: false,
    dataPrivacy: false,
  });

  const allAcknowledged = Object.values(acknowledged).every(Boolean);

  const disclaimerPoints = [
    {
      icon: AlertTriangle,
      title: 'Not Medical Advice',
      description: 'This AI assistant provides educational information only and cannot diagnose, treat, or prescribe.',
      key: 'notMedicalAdvice',
    },
    {
      icon: Shield,
      title: 'Consult Professionals',
      description: 'Always consult qualified healthcare providers for medical concerns and before making health decisions.',
      key: 'seekProfessional',
    },
    {
      icon: Phone,
      title: 'Emergency Situations',
      description: 'In emergencies, call 911 (US) or your local emergency number immediately. Do not rely on this AI.',
      key: 'emergency',
    },
    {
      icon: Heart,
      title: 'Data & Privacy',
      description: 'Your conversations are private and encrypted. We do not share your health information.',
      key: 'dataPrivacy',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Important Medical Disclaimer
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Please read and acknowledge the following before using TeleHealth AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-6">
          {/* Emergency Banner */}
          <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-900 dark:text-red-100">
                  Emergency Numbers
                </p>
                <div className="text-sm text-red-800 dark:text-red-200">
                  <p>🇺🇸 US: 911 | 🇬🇧 UK: 999 | 🇪🇺 EU: 112</p>
                  <p>Mental Health Crisis: 988 (US)</p>
                </div>
              </div>
            </div>
          </Card>

          <Separator />

          {/* Disclaimer Points */}
          <div className="space-y-3">
            {disclaimerPoints.map((point, index) => (
              <motion.div
                key={point.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={point.key}
                      checked={acknowledged[point.key as keyof typeof acknowledged]}
                      onCheckedChange={(checked) =>
                        setAcknowledged((prev) => ({
                          ...prev,
                          [point.key]: checked as boolean,
                        }))
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={point.key}
                        className="flex items-center gap-2 text-base font-medium cursor-pointer"
                      >
                        <point.icon className="h-4 w-4 text-primary" />
                        {point.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {point.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">By using TeleHealth AI, you understand that:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>This service is for informational and educational purposes only</li>
              <li>AI responses are not a substitute for professional medical judgment</li>
              <li>You should not delay seeking medical care based on AI information</li>
              <li>The AI may make mistakes or provide outdated information</li>
              <li>Your health decisions remain your responsibility</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onDecline}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            I Decline
          </Button>
          <Button
            onClick={onAccept}
            disabled={!allAcknowledged}
            className="w-full sm:w-auto"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            I Understand & Accept
          </Button>
        </DialogFooter>

        <AnimatePresence>
          {!allAcknowledged && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-center text-muted-foreground mt-2"
            >
              Please acknowledge all points to continue
            </motion.p>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}