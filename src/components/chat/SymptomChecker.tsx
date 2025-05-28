'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Heart,
  Brain,
  Shield,
  Sun,
  Sparkles,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Persona } from '@prisma/client';
import { SymptomCheckerFlow, SymptomCheckerNode } from '@/types/chat.types';

interface SymptomCheckerProps {
  onComplete: (persona: Persona) => void;
  onSkip: () => void;
}

const symptomFlow: SymptomCheckerFlow = {
  id: 'main',
  name: 'Main Symptom Flow',
  startNodeId: 'start',
  nodes: {
    start: {
      id: 'start',
      question: 'What best describes your primary concern?',
      type: 'single',
      options: [
        {
          id: 'mental',
          label: 'Mental or emotional health',
          nextNodeId: 'mental-specific',
        },
        {
          id: 'physical',
          label: 'Physical symptoms',
          nextNodeId: 'physical-location',
        },
        {
          id: 'skin',
          label: 'Skin, hair, or nail issues',
          nextNodeId: 'skin-specific',
        },
        {
          id: 'allergy',
          label: 'Allergies or immune reactions',
          nextNodeId: 'allergy-specific',
        },
        {
          id: 'aging',
          label: 'Aging or senior health concerns',
          suggestedPersona: 'GERIATRICIAN',
        },
        {
          id: 'emergency',
          label: 'This might be an emergency',
          nextNodeId: 'emergency-check',
          urgency: 'emergency',
        },
      ],
    },
    'mental-specific': {
      id: 'mental-specific',
      question: 'What aspect of mental health concerns you?',
      type: 'single',
      options: [
        {
          id: 'mood',
          label: 'Mood (depression, bipolar)',
          suggestedPersona: 'PSYCHIATRIST',
        },
        {
          id: 'anxiety',
          label: 'Anxiety or panic',
          suggestedPersona: 'PSYCHIATRIST',
        },
        {
          id: 'therapy',
          label: 'Therapy or coping strategies',
          suggestedPersona: 'PSYCHOLOGIST',
        },
        {
          id: 'medication',
          label: 'Psychiatric medications',
          suggestedPersona: 'PSYCHIATRIST',
        },
        {
          id: 'relationship',
          label: 'Relationships or behavior',
          suggestedPersona: 'PSYCHOLOGIST',
        },
      ],
    },
    'physical-location': {
      id: 'physical-location',
      question: 'Where are you experiencing symptoms?',
      type: 'single',
      options: [
        {
          id: 'chest',
          label: 'Chest or heart',
          nextNodeId: 'chest-emergency',
          urgency: 'high',
        },
        {
          id: 'head',
          label: 'Head or neurological',
          nextNodeId: 'head-symptoms',
        },
        {
          id: 'breathing',
          label: 'Breathing or respiratory',
          nextNodeId: 'breathing-check',
        },
        {
          id: 'skin',
          label: 'Skin or external',
          suggestedPersona: 'DERMATOLOGIST',
        },
        {
          id: 'general',
          label: 'General or multiple areas',
          nextNodeId: 'general-symptoms',
        },
      ],
    },
    'skin-specific': {
      id: 'skin-specific',
      question: 'What type of skin concern do you have?',
      type: 'single',
      options: [
        {
          id: 'rash',
          label: 'Rash or irritation',
          suggestedPersona: 'DERMATOLOGIST',
        },
        {
          id: 'acne',
          label: 'Acne or breakouts',
          suggestedPersona: 'DERMATOLOGIST',
        },
        {
          id: 'mole',
          label: 'Mole or growth changes',
          suggestedPersona: 'DERMATOLOGIST',
          urgency: 'medium',
        },
        {
          id: 'hair',
          label: 'Hair loss or scalp issues',
          suggestedPersona: 'DERMATOLOGIST',
        },
        {
          id: 'nail',
          label: 'Nail problems',
          suggestedPersona: 'DERMATOLOGIST',
        },
      ],
    },
    'allergy-specific': {
      id: 'allergy-specific',
      question: 'What type of allergic reaction?',
      type: 'single',
      options: [
        {
          id: 'food',
          label: 'Food allergy',
          suggestedPersona: 'ALLERGIST',
        },
        {
          id: 'environmental',
          label: 'Environmental (pollen, dust, pets)',
          suggestedPersona: 'ALLERGIST',
        },
        {
          id: 'medication',
          label: 'Medication reaction',
          suggestedPersona: 'ALLERGIST',
          urgency: 'high',
        },
        {
          id: 'severe',
          label: 'Severe reaction (anaphylaxis)',
          nextNodeId: 'emergency-check',
          urgency: 'emergency',
        },
        {
          id: 'asthma',
          label: 'Asthma or breathing issues',
          suggestedPersona: 'ALLERGIST',
        },
      ],
    },
    'emergency-check': {
      id: 'emergency-check',
      question: 'Are you experiencing any of these emergency symptoms?',
      type: 'single',
      options: [
        {
          id: 'yes',
          label: 'Yes - I need immediate help',
          urgency: 'emergency',
        },
        {
          id: 'no',
          label: 'No - Continue with symptom checker',
          nextNodeId: 'start',
        },
      ],
    },
    'chest-emergency': {
      id: 'chest-emergency',
      question: 'Is this chest pain severe or accompanied by other symptoms?',
      type: 'single',
      options: [
        {
          id: 'severe',
          label: 'Yes - severe pain, pressure, or other symptoms',
          urgency: 'emergency',
        },
        {
          id: 'mild',
          label: 'No - mild discomfort only',
          suggestedPersona: 'PSYCHIATRIST', // Could be anxiety
        },
      ],
    },
    'breathing-check': {
      id: 'breathing-check',
      question: 'How severe is your breathing difficulty?',
      type: 'single',
      options: [
        {
          id: 'severe',
          label: 'Severe - struggling to breathe',
          urgency: 'emergency',
        },
        {
          id: 'moderate',
          label: 'Moderate - some difficulty',
          suggestedPersona: 'ALLERGIST',
          urgency: 'high',
        },
        {
          id: 'mild',
          label: 'Mild - slight discomfort',
          suggestedPersona: 'ALLERGIST',
        },
      ],
    },
  },
};

const personaIcons: Record<Persona, any> = {
  PSYCHIATRIST: Brain,
  ALLERGIST: Shield,
  GERIATRICIAN: Heart,
  DERMATOLOGIST: Sun,
  PSYCHOLOGIST: Sparkles,
};

export function SymptomChecker({ onComplete, onSkip }: SymptomCheckerProps) {
  const [currentNodeId, setCurrentNodeId] = useState('start');
  const [history, setHistory] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showEmergency, setShowEmergency] = useState(false);

  const currentNode = symptomFlow.nodes[currentNodeId];

  const handleNext = () => {
    if (!selectedOption) return;

    const option = currentNode.options?.find(opt => opt.id === selectedOption);
    if (!option) return;

    // Check for emergency
    if (option.urgency === 'emergency') {
      setShowEmergency(true);
      return;
    }

    // Check for suggested persona
    if (option.suggestedPersona) {
      onComplete(option.suggestedPersona as Persona);
      return;
    }

    // Navigate to next node
    if (option.nextNodeId) {
      setHistory([...history, currentNodeId]);
      setCurrentNodeId(option.nextNodeId);
      setSelectedOption('');
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const previousNodeId = newHistory.pop()!;
      setHistory(newHistory);
      setCurrentNodeId(previousNodeId);
      setSelectedOption('');
    }
  };

  if (showEmergency) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-screen p-4"
      >
        <Card className="max-w-2xl w-full p-8 border-red-500 bg-red-50 dark:bg-red-950/20">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-full">
                <Phone className="h-12 w-12 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-red-600">Emergency Medical Attention Needed</h2>
            
            <div className="space-y-4 text-lg">
              <p className="font-semibold">Please call emergency services immediately:</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    US: 911
                  </Badge>
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    UK: 999
                  </Badge>
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    EU: 112
                  </Badge>
                </div>
              </div>
              
              <p className="text-muted-foreground">
                If you're experiencing severe symptoms like chest pain, difficulty breathing, 
                severe bleeding, or thoughts of self-harm, please seek immediate medical attention.
              </p>
            </div>
            
            <div className="flex gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setShowEmergency(false)}
              >
                It's not an emergency
              </Button>
              <Button 
                size="lg" 
                variant="destructive"
                onClick={() => window.location.href = 'tel:911'}
              >
                Call Emergency Services
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen p-4"
    >
      <Card className="max-w-2xl w-full p-8">
        <div className="space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Symptom Checker</h2>
            <Button variant="ghost" onClick={onSkip}>
              Skip
            </Button>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNodeId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{currentNode.question}</h3>
                {currentNode.type === 'single' && (
                  <p className="text-sm text-muted-foreground">Select one option</p>
                )}
              </div>

              {/* Options */}
              {currentNode.type === 'single' && currentNode.options && (
                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                  <div className="space-y-3">
                    {currentNode.options.map((option) => (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                      >
                        <Label
                          htmlFor={option.id}
                          className="flex items-center space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                        >
                          <RadioGroupItem value={option.id} id={option.id} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{option.label}</span>
                              {option.urgency && (
                                <Badge 
                                  variant={option.urgency === 'emergency' ? 'destructive' : 'secondary'}
                                  className="ml-2"
                                >
                                  {option.urgency === 'emergency' ? 'Emergency' : 
                                   option.urgency === 'high' ? 'Urgent' : 'Monitor'}
                                </Badge>
                              )}
                            </div>
                            {option.suggestedPersona && (
                              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                <span>Recommends: </span>
                                {(() => {
                                  const Icon = personaIcons[option.suggestedPersona as Persona];
                                  return <Icon className="h-4 w-4 ml-1 mr-1" />;
                                })()}
                                <span>{option.suggestedPersona.replace('_', ' ')}</span>
                              </div>
                            )}
                          </div>
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentNode.type === 'text' && (
                <Textarea
                  placeholder="Please describe your symptoms..."
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="min-h-[120px]"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={history.length === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedOption}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">
                This symptom checker is for informational purposes only and does not constitute medical advice. 
                Always consult with a healthcare professional for medical concerns.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}