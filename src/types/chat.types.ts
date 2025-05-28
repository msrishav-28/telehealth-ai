import { Persona, MessageRole } from '@prisma/client';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  timestamp: Date;
  flagged?: boolean;
  isStreaming?: boolean;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
  source: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  persona: Persona;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  title?: string;
}

export interface PersonaConfig {
  id: Persona;
  name: string;
  title: string;
  description: string;
  avatar: string;
  specialties: string[];
  systemPrompt: string;
  greeting: string;
  color: string;
  icon: string;
}

export interface SymptomCheckerNode {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text';
  options?: {
    id: string;
    label: string;
    nextNodeId?: string;
    suggestedPersona?: Persona;
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
  }[];
  nextNodeId?: string;
}

export interface SymptomCheckerFlow {
  id: string;
  name: string;
  startNodeId: string;
  nodes: Record<string, SymptomCheckerNode>;
}

export interface MedicationInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  recommendation: string;
}

export interface RedFlag {
  id: string;
  patterns: string[];
  severity: 'warning' | 'urgent' | 'emergency';
  message: string;
  action: 'alert' | 'block' | 'redirect';
  phoneNumbers?: string[];
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  persona?: Persona;
  voiceInput?: boolean;
  attachments?: string[];
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
  suggestedFollowUps?: string[];
  redFlagDetected?: boolean;
  redFlagDetails?: RedFlag;
}

export interface StreamingChatResponse {
  token?: string;
  message?: ChatMessage;
  done?: boolean;
  error?: string;
}