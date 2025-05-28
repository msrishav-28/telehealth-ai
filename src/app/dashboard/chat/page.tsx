'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Plus, 
  History, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { PersonaSelector } from '@/components/chat/PersonaSelector';
import { trpc } from '@/lib/trpc/client';
import { Persona } from '@prisma/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function ChatPage() {
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch conversations
  const { data: conversationsData, refetch: refetchConversations } = trpc.chat.getConversations.useQuery({
    limit: 50,
  });

  // Create new conversation
  const createConversation = trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      setSelectedConversationId(data.id);
      refetchConversations();
    },
  });

  // Delete conversation
  const deleteConversation = trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      setSelectedConversationId(null);
      refetchConversations();
    },
  });

  const handleNewChat = () => {
    if (selectedPersona) {
      createConversation.mutate({ persona: selectedPersona });
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    // Find the persona from the conversation
    const conversation = conversationsData?.conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedPersona(conversation.persona);
    }
  };

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    // Create a new conversation with this persona
    createConversation.mutate({ persona });
  };

  // Auto-select first conversation if available
  useEffect(() => {
    if (!selectedConversationId && conversationsData?.conversations.length) {
      handleSelectConversation(conversationsData.conversations[0].id);
    }
  }, [conversationsData, selectedConversationId]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <motion.div
        initial={{ width: 320 }}
        animate={{ width: sidebarCollapsed ? 0 : 320 }}
        transition={{ duration: 0.3 }}
        className="relative border-r bg-muted/10"
      >
        <div className={cn("flex h-full flex-col", sidebarCollapsed && "hidden")}>
          {/* Sidebar Header */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Conversations</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              onClick={handleNewChat} 
              className="w-full gap-2"
              disabled={!selectedPersona}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>

            {!selectedPersona && (
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                Select a specialist to start a new conversation
              </div>
            )}
          </div>

          <Separator />

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {conversationsData?.conversations.map((conversation) => {
                const lastMessage = conversation.messages[0];
                const isSelected = selectedConversationId === conversation.id;
                
                return (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 4 }}
                  >
                    <Card
                      className={cn(
                        "p-3 cursor-pointer transition-colors",
                        isSelected && "bg-accent"
                      )}
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {conversation.title || `Chat with ${conversation.persona}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(conversation.updatedAt), 'MMM d')}
                          </span>
                        </div>
                        {lastMessage && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {lastMessage.content}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {conversation.persona.replace('_', ' ')}
                          </span>
                          {conversation.metrics && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{conversation.metrics.messageCount} messages</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
              
              {(!conversationsData || conversationsData.conversations.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No conversations yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a specialist above to start
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Sidebar Footer */}
          <Separator />
          <div className="p-4 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => router.push('/dashboard/history')}
            >
              <History className="h-4 w-4" />
              History
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => router.push('/dashboard/settings')}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Sidebar Toggle (when collapsed) */}
      {sidebarCollapsed && (
        <div className="absolute left-0 top-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(false)}
            className="rounded-r-lg rounded-l-none"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Persona Selector */}
        <div className="border-b p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <PersonaSelector
                selected={selectedPersona}
                onSelect={handlePersonaSelect}
              />
              {selectedConversationId && (
                <div className="text-sm text-muted-foreground">
                  Chat ID: {selectedConversationId.slice(0, 8)}...
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedConversationId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Delete this conversation?')) {
                      deleteConversation.mutate({ conversationId: selectedConversationId });
                    }
                  }}
                >
                  Delete Chat
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          {selectedConversationId ? (
            <ChatWindow
              key={selectedConversationId}
              conversationId={selectedConversationId}
              initialPersona={selectedPersona}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 max-w-md"
              >
                <div className="flex justify-center">
                  <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold">Welcome to TeleHealth AI</h3>
                <p className="text-muted-foreground">
                  Select a specialist from the dropdown above to start a conversation
                  about your health concerns.
                </p>
                <div className="pt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Available specialists:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Psychiatrist', 'Allergist', 'Geriatrician', 'Dermatologist', 'Psychologist'].map((specialist) => (
                      <span key={specialist} className="px-3 py-1 bg-muted rounded-full text-sm">
                        {specialist}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}