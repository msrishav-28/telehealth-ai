'use client';

import { ExternalLink } from 'lucide-react';
import type { Citation } from '@/types/chat.types';

export function CitationCard({ citation }: { citation: Citation }) {
  return (
    <a href={citation.url} target="_blank" rel="noreferrer" className="block rounded-md border p-3 text-sm hover:bg-accent">
      <div className="flex items-center justify-between gap-2 font-medium">
        <span>{citation.title}</span>
        <ExternalLink className="h-4 w-4" />
      </div>
      <p className="mt-1 text-muted-foreground line-clamp-2">{citation.snippet}</p>
      <p className="mt-1 text-xs text-muted-foreground">{citation.source}</p>
    </a>
  );
}
