'use client';

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useInView } from 'react-intersection-observer';
import { ChatMessage } from '@/types/chat.types';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { CitationCard } from '@/components/chat/CitationCard';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { motion } from 'framer-motion';

interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  height?: number;
  className?: string;
}

interface MessageItemData {
  messages: ChatMessage[];
  isLoading: boolean;
}

const MessageRow: React.FC<ListChildComponentProps<MessageItemData>> = ({
  index,
  style,
  data,
}) => {
  const { messages, isLoading } = data;
  const message = messages[index];

  if (!message) {
    return (
      <div style={style} className="flex items-center justify-center">
        <div className="animate-pulse bg-muted rounded-lg h-16 w-full mx-4" />
      </div>
    );
  }

  return (
    <div style={style} className="px-4 py-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
    </div>
  );
};

export function VirtualizedMessageList({
  messages,
  isLoading = false,
  hasNextPage = false,
  loadMore,
  height = 600,
  className,
}: VirtualizedMessageListProps) {
  const listRef = useRef<List>(null);
  const { ref: bottomRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  // Load more when scrolling near the top
  const { ref: topRef, inView: topInView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (topInView && hasNextPage && loadMore) {
      loadMore();
    }
  }, [topInView, hasNextPage, loadMore]);

  const itemData = useMemo(
    () => ({
      messages,
      isLoading,
    }),
    [messages, isLoading]
  );

  const itemCount = messages.length + (isLoading ? 1 : 0);

  const isItemLoaded = useCallback(
    (index: number) => {
      return index < messages.length;
    },
    [messages.length]
  );

  const loadMoreItems = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (loadMore && hasNextPage) {
        await loadMore();
      }
    },
    [loadMore, hasNextPage]
  );

  // Calculate item size dynamically based on content
  const getItemSize = useCallback((index: number) => {
    const message = messages[index];
    if (!message) return 80;

    // Base height for message bubble
    let height = 80;

    // Add height for citations
    if (message.citations && message.citations.length > 0) {
      height += 40 + message.citations.length * 60;
    }

    // Add height for longer messages
    const contentLines = Math.ceil(message.content.length / 80);
    height += Math.max(0, (contentLines - 2) * 20);

    return Math.min(height, 400); // Cap at 400px
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>No messages yet</p>
          <p className="text-sm">Start a conversation to see messages here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      {hasNextPage && (
        <div ref={topRef} className="h-1" />
      )}
      
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={(list) => {
              listRef.current = list;
              ref(list);
            }}
            height={height}
            itemCount={itemCount}
            itemSize={getItemSize}
            itemData={itemData}
            onItemsRendered={onItemsRendered}
            overscanCount={5}
          >
            {MessageRow}
          </List>
        )}
      </InfiniteLoader>

      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <TypingIndicator />
        </div>
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}