'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ConversationMetric = { id: string; title: string | null; messageCount: number };

export function ResponseTimeGraph({ data = [] }: { data?: ConversationMetric[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No response activity yet.</p>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 8).map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{item.title ?? 'Conversation'}</span>
                  <span>{item.messageCount}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, item.messageCount * 10)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
