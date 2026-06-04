'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Download, Mic, MicOff, Paperclip, Send, Sparkles } from 'lucide-react';
import { Persona } from '@prisma/client';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
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

interface ChatWindowProps {
  conversationId?: string;
  initialPersona?: Persona;
}

export function ChatWindow({ conversationId, initialPersona }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<Persona | undefined>(initialPersona);
  const [showSymptomChecker, setShowSymptomChecker] = useState(!initialPersona);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, sendMessage, exportConversation, clearConversation } = useChat(conversationId, {
    streaming: true,
  });
  const { isListening, transcript, startListening, stopListening } = useVoice();

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !selectedPersona) return;
    const message = input.trim();
    setInput('');

    const emergencyKeywords = ['suicide', 'kill myself', 'emergency', 'dying', 'chest pain'];
    if (emergencyKeywords.some((keyword) => message.toLowerCase().includes(keyword))) {
      setShowEmergencyBanner(true);
    }

    await sendMessage({ message, persona: selectedPersona, conversationId });
  };

  const handleExport = async () => {
    const url = await exportConversation('PDF');
    if (url) {
      window.open(url, '_blank');
      toast.success('Conversation exported successfully.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast.error('File uploads are not implemented yet.');
      event.target.value = '';
    }
  };

  if (showDisclaimer) {
    return (
      <DisclaimerModal
        isOpen={showDisclaimer}
        onAccept={() => setShowDisclaimer(false)}
        onDecline={() => { window.location.href = '/'; }}
      />
    );
  }

  if (showSymptomChecker) {
    return (
      <SymptomChecker
        onComplete={(persona) => {
          setSelectedPersona(persona);
          setShowSymptomChecker(false);
        }}
        onSkip={() => setShowSymptomChecker(false)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence>
        {showEmergencyBanner && <EmergencyBanner onClose={() => setShowEmergencyBanner(false)} />}
      </AnimatePresence>

      <div className="border-b p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <PersonaSelector selected={selectedPersona} onSelect={setSelectedPersona} />
            <div className="text-sm text-muted-foreground">{messages.length} messages</div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleExport} disabled={messages.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void clearConversation()} disabled={messages.length === 0}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full flex-col items-center justify-center text-center"
          >
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Welcome to TeleHealth AI</h3>
            <p className="max-w-md text-muted-foreground">
              Ask educational health questions. This AI does not replace professional medical advice.
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
              <MessageBubble message={message} isLast={index === messages.length - 1} />
              {message.citations && message.citations.length > 0 && (
                <div className="ml-12 mt-2 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Sources:</p>
                  {message.citations.map((citation) => (
                    <CitationCard key={citation.id} citation={citation} />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-2">
            <TypingIndicator />
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex items-end space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.txt,.doc,.docx,.jpg,.png"
          />
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Type your health question..."
              disabled={isLoading}
              className="min-h-[60px] resize-none pr-12"
              rows={1}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
            >
              {isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
            </Button>
          </div>
          <Button onClick={() => void handleSend()} disabled={!input.trim() || isLoading || !selectedPersona} className="gap-2">
            <Send className="h-5 w-5" />
            Send
          </Button>
        </div>

        {isListening && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
            <VoiceInput isListening={isListening} transcript={transcript} onStop={stopListening} />
          </motion.div>
        )}

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>For educational purposes only</span>
          </div>
          <div>
            Press <kbd className="rounded bg-muted px-1 py-0.5 text-xs">Enter</kbd> to send
          </div>
        </div>
      </div>
    </div>
  );
}
