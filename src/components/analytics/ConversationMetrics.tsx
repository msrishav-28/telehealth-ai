'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ConversationMetric = {
  id: string;
  title: string | null;
  persona: string;
  messageCount: number;
  userSatisfaction: number | null;
};

export function ConversationMetrics({ data = [] }: { data?: ConversationMetric[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conversation metrics yet.</p>
        ) : (
          data.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">{item.title ?? item.persona}</p>
                <p className="text-muted-foreground">{item.persona}</p>
              </div>
              <div className="text-right">
                <p>{item.messageCount} messages</p>
                <p className="text-muted-foreground">Rating: {item.userSatisfaction ?? '—'}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
