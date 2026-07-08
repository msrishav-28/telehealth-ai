import { useState, useCallback, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { ChatMessage, ChatRequest, Citation } from '@/types/chat.types';
import toast from 'react-hot-toast';

interface UseChatOptions {
  onError?: (error: Error) => void;
  onSuccess?: (message: ChatMessage) => void;
  streaming?: boolean;
}

export function useChat(conversationId?: string, options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch conversation history
  const { data: conversation } = trpc.chat.getConversation.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId }
  );

  // Send message mutation
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, data]);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message);
      options.onError?.(new Error(error.message));
    },
  });

  // Export conversation mutation
  const exportMutation = trpc.chat.exportConversation.useMutation();
  const deleteConversationMutation = trpc.chat.deleteConversation.useMutation();

  // Send message with streaming support
  const sendMessage = useCallback(
    async (request: ChatRequest) => {
      if (!conversationId && !request.conversationId) {
        toast.error('No conversation selected');
        return;
      }

      setIsLoading(true);
      const messageId = `temp-${Date.now()}`;

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: messageId + '-user',
        role: 'USER',
        content: request.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        if (options.streaming && request.persona) {
          // Use streaming endpoint
          abortControllerRef.current = new AbortController();
          
          const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: request.message,
              persona: request.persona,
              conversationId: request.conversationId || conversationId,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            throw new Error('Streaming failed');
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('No reader available');
          }

          // Add assistant message placeholder
          const assistantMessage: ChatMessage = {
            id: messageId + '-assistant',
            role: 'ASSISTANT',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
          };
          setMessages((prev) => [...prev, assistantMessage]);

          let accumulatedContent = '';
          let citations: Citation[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                let parsed: { type?: string; content?: string; citations?: Citation[]; error?: string };
                try {
                  parsed = JSON.parse(data);
                } catch (e) {
                  console.error('Failed to parse SSE data:', e);
                  continue;
                }

                if (parsed.type === 'content') {
                  accumulatedContent += parsed.content ?? '';
                  setStreamingMessage(accumulatedContent);

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === messageId + '-assistant'
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                } else if (parsed.type === 'citations') {
                  citations = parsed.citations ?? [];
                } else if (parsed.type === 'done') {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === messageId + '-assistant'
                        ? {
                            ...msg,
                            content: accumulatedContent,
                            citations,
                            isStreaming: false,
                          }
                        : msg
                    )
                  );
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.error ?? 'Streaming failed');
                }
              }
            }
          }
        } else {
          // Use regular mutation
          await sendMessageMutation.mutateAsync({
            conversationId: request.conversationId || conversationId!,
            message: request.message,
            persona: request.persona,
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          toast('Message cancelled');
        } else {
          toast.error(error.message || 'Failed to send message');
          options.onError?.(error);
        }
      } finally {
        setIsLoading(false);
        setStreamingMessage('');
        abortControllerRef.current = null;
      }
    },
    [conversationId, options, sendMessageMutation]
  );

  // Cancel streaming
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Export conversation
  const exportConversation = useCallback(
    async (format: 'PDF' | 'TXT' | 'JSON' = 'PDF') => {
      if (!conversationId) return null;

      try {
        const result = await exportMutation.mutateAsync({
          conversationId,
          format,
        });
        return result.url;
      } catch (error) {
        toast.error('Failed to export conversation');
        return null;
      }
    },
    [conversationId, exportMutation]
  );

  // Archive the active conversation server-side, then clear local state.
  const clearConversation = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      await deleteConversationMutation.mutateAsync({ conversationId });
      setMessages([]);
      toast.success('Conversation cleared');
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear conversation');
    }
  }, [conversationId, deleteConversationMutation]);

  // Update messages when conversation data loads
  useEffect(() => {
    if (conversation?.messages) {
      setMessages(
        conversation.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          citations: msg.citations,
          timestamp: msg.createdAt,
        }))
      );
    }
  }, [conversation?.messages]);

  return {
    messages,
    isLoading,
    streamingMessage,
    sendMessage,
    cancelStreaming,
    exportConversation,
    clearConversation,
    conversation,
  };
}