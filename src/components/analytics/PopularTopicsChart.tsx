'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TopicMetric = { topic: string; count: number; rank?: number };

export function PopularTopicsChart({ data = [] }: { data?: TopicMetric[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Topics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No topic data yet.</p>
        ) : (
          data.map((item) => (
            <div key={item.topic} className="flex items-center justify-between text-sm">
              <span>{item.rank ? `${item.rank}. ` : ''}{item.topic}</span>
              <span className="text-muted-foreground">{item.count}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
