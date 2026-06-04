'use client';

import { Button } from '@/components/ui/button';

export function VoiceInput({ isListening, transcript, onStop }: { isListening: boolean; transcript: string; onStop: () => void }) {
  return (
    <div className="rounded-md border bg-muted p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span>{isListening ? 'Listening…' : 'Voice input paused'}</span>
        <Button type="button" variant="outline" size="sm" onClick={onStop}>Stop</Button>
      </div>
      {transcript && <p className="mt-2 text-muted-foreground">{transcript}</p>}
    </div>
  );
}
