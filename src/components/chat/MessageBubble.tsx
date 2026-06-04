'use client';

import { MessageRole } from '@prisma/client';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/chat.types';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === MessageRole.USER || message.role === 'USER';
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%] rounded-lg px-4 py-3 text-sm', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
        <ReactMarkdown>{message.content}</ReactMarkdown>
        {message.flagged && <p className="mt-2 text-xs font-medium text-destructive">Safety alert detected</p>}
      </div>
    </div>
  );
}
