'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Download, 
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './MessageBubble';
import { CitationCard } from './CitationCard';
import { PersonaSelector } from './PersonaSelector';
import { SymptomChecker } from './SymptomChecker';
import { VoiceInput } from './VoiceInput';
import { TypingIndicator } from './TypingIndicator';
import { DisclaimerModal } from '@/components/safety/DisclaimerModal';
import { EmergencyBanner } from '@/components/safety/EmergencyBanner';
import { useChat } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import { Persona } from '@prisma/client';
import { ChatMessage } from '@/types/chat.types';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  conversationId?: string;
  initialPersona?: Persona;
}

export function ChatWindow({ conversationId, initialPersona }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<Persona | undefined>(initialPersona);
  const [showSymptomChecker, setShowSymptomChecker] = useState(!selectedPersona);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    exportConversation,
    clearConversation,
  } = useChat(conversationId);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
  } = useVoice();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');

    // Check for emergency keywords
    const emergencyKeywords = ['suicide', 'kill myself', 'emergency', 'dying'];
    if (emergencyKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      setShowEmergencyBanner(true);
    }

    await sendMessage({
      message,
      persona: selectedPersona,
      conversationId,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleExport = async () => {
    try {
      const url = await exportConversation('PDF');
      if (url) {
        window.open(url, '_blank');
        toast.success('Conversation exported successfully!');
      }
    } catch (error) {
      toast.error('Failed to export conversation');
    }
  };

  const handleSymptomCheckerComplete = (persona: Persona) => {
    setSelectedPersona(persona);
    setShowSymptomChecker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      toast.success(`File "${file.name}" uploaded successfully`);
    }
  };

  if (showDisclaimer) {
    return (
      <DisclaimerModal
        isOpen={showDisclaimer}
        onAccept={() => setShowDisclaimer(false)}
        onDecline={() => window.location.href = '/'}
      />
    );
  }

  if (showSymptomChecker && !selectedPersona) {
    return (
      <SymptomChecker
        onComplete={handleSymptomCheckerComplete}
        onSkip={() => setShowSymptomChecker(false)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Emergency Banner */}
      <AnimatePresence>
        {showEmergencyBanner && (
          <EmergencyBanner onClose={() => setShowEmergencyBanner(false)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <PersonaSelector
              selected={selectedPersona}
              onSelect={setSelectedPersona}
            />
            <div className="text-sm text-muted-foreground">
              {messages.length} messages
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              disabled={messages.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              disabled={messages.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Welcome to TeleHealth AI
            </h3>
            <p className="text-muted-foreground max-w-md">
              I'm here to help answer your health questions. Remember, this is for
              educational purposes only and doesn't replace professional medical advice.
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MessageBubble
                message={message}
                isLast={index === messages.length - 1}
              />
              {message.citations && message.citations.length > 0 && (
                <div className="mt-2 space-y-2 ml-12">
                  <p className="text-sm font-medium text-muted-foreground">
                    Sources:
                  </p>
                  {message.citations.map((citation) => (
                    <CitationCard key={citation.id} citation={citation} />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <TypingIndicator />
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-end space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.txt,.doc,.docx,.jpg,.png"
          />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your health question..."
              disabled={isLoading}
              className="min-h-[60px] pr-12 resize-none"
              rows={1}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2"
              onClick={handleVoiceToggle}
              disabled={isLoading}
            >
              {isListening ? (
                <MicOff className="h-5 w-5 text-red-500" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          </div>

          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="gap-2"
          >
            <Send className="h-5 w-5" />
            Send
          </Button>
        </div>

        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            <VoiceInput
              isListening={isListening}
              transcript={transcript}
              onStop={stopListening}
            />
          </motion.div>
        )}

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>For educational purposes only</span>
          </div>
          <div>
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send
          </div>
        </div>
      </div>
    </div>
  );