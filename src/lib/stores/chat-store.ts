import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { ChatMessage, Citation } from '@/types/chat.types';
import { Persona } from '@prisma/client';

interface Conversation {
  id: string;
  title?: string;
  persona: Persona;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean;
  tags?: string[];
}

interface ChatState {
  // State
  conversations: Conversation[];
  activeConversationId: string | null;
  isTyping: boolean;
  streamingMessage: string;
  searchQuery: string;
  selectedTags: string[];
  
  // UI State
  sidebarCollapsed: boolean;
  showSearch: boolean;
  
  // Actions
  setActiveConversation: (id: string | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  
  // Message actions
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  setIsTyping: (typing: boolean) => void;
  setStreamingMessage: (message: string) => void;
  
  // Search and filter
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  getFilteredConversations: () => Conversation[];
  
  // UI actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setShowSearch: (show: boolean) => void;
  
  // Utilities
  getActiveConversation: () => Conversation | null;
  getAllTags: () => string[];
  clearAll: () => void;
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        conversations: [],
        activeConversationId: null,
        isTyping: false,
        streamingMessage: '',
        searchQuery: '',
        selectedTags: [],
        sidebarCollapsed: false,
        showSearch: false,

        // Actions
        setActiveConversation: (id) => set({ activeConversationId: id }),

        addConversation: (conversation) =>
          set((state) => ({
            conversations: [conversation, ...state.conversations],
            activeConversationId: conversation.id,
          })),

        updateConversation: (id, updates) =>
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv
            ),
          })),

        deleteConversation: (id) =>
          set((state) => ({
            conversations: state.conversations.filter((conv) => conv.id !== id),
            activeConversationId:
              state.activeConversationId === id ? null : state.activeConversationId,
          })),

        archiveConversation: (id) =>
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === id ? { ...conv, isArchived: true } : conv
            ),
          })),

        addMessage: (conversationId, message) =>
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    messages: [...conv.messages, message],
                    updatedAt: new Date(),
                  }
                : conv
            ),
          })),

        updateMessage: (conversationId, messageId, updates) =>
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    messages: conv.messages.map((msg) =>
                      msg.id === messageId ? { ...msg, ...updates } : msg
                    ),
                  }
                : conv
            ),
          })),

        setIsTyping: (typing) => set({ isTyping: typing }),
        setStreamingMessage: (message) => set({ streamingMessage: message }),

        setSearchQuery: (query) => set({ searchQuery: query }),
        setSelectedTags: (tags) => set({ selectedTags: tags }),

        getFilteredConversations: () => {
          const { conversations, searchQuery, selectedTags } = get();
          
          return conversations.filter((conv) => {
            // Filter by search query
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              const matchesTitle = conv.title?.toLowerCase().includes(query);
              const matchesMessages = conv.messages.some((msg) =>
                msg.content.toLowerCase().includes(query)
              );
              if (!matchesTitle && !matchesMessages) return false;
            }

            // Filter by tags
            if (selectedTags.length > 0) {
              const hasMatchingTag = selectedTags.some((tag) =>
                conv.tags?.includes(tag)
              );
              if (!hasMatchingTag) return false;
            }

            // Hide archived by default
            return !conv.isArchived;
          });
        },

        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        setShowSearch: (show) => set({ showSearch: show }),

        getActiveConversation: () => {
          const { conversations, activeConversationId } = get();
          return conversations.find((conv) => conv.id === activeConversationId) || null;
        },

        getAllTags: () => {
          const { conversations } = get();
          const allTags = conversations.flatMap((conv) => conv.tags || []);
          return Array.from(new Set(allTags));
        },

        clearAll: () =>
          set({
            conversations: [],
            activeConversationId: null,
            isTyping: false,
            streamingMessage: '',
            searchQuery: '',
            selectedTags: [],
          }),
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          conversations: state.conversations,
          activeConversationId: state.activeConversationId,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    )
  )
);

// Selectors for better performance
export const useActiveConversation = () =>
  useChatStore((state) => state.getActiveConversation());

export const useFilteredConversations = () =>
  useChatStore((state) => state.getFilteredConversations());

export const useConversationMessages = (conversationId: string) =>
  useChatStore((state) =>
    state.conversations.find((conv) => conv.id === conversationId)?.messages || []
  );