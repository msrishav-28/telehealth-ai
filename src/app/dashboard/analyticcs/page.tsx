'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock,
  Brain,
  Heart,
  Shield,
  Sparkles,
  Sun,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConversationMetrics } from '@/components/analytics/ConversationMetrics';
import { PopularTopicsChart } from '@/components/analytics/PopularTopicsChart';
import { ResponseTimeGraph } from '@/components/analytics/ResponseTimeGraph';
import { trpc } from '@/lib/trpc/client';
import { Persona } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';

const personaIcons = {
  PSYCHIATRIST: Brain,
  ALLERGIST: Shield,
  GERIATRICIAN: Heart,
  DERMATOLOGIST: Sun,
  PSYCHOLOGIST: Sparkles,
};

const personaColors = {
  PSYCHIATRIST: 'text-purple-500',
  ALLERGIST: 'text-blue-500',
  GERIATRICIAN: 'text-red-500',
  DERMATOLOGIST: 'text-yellow-500',
  PSYCHOLOGIST: 'text-green-500',
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  
  const { data: analytics, isLoading } = trpc.analytics.getUserAnalytics.useQuery({
    timeRange,
  });

  const { data: conversationStats } = trpc.analytics.getConversationStats.useQuery({
    timeRange,
  });

  const { data: topicAnalytics } = trpc.analytics.getTopicAnalytics.useQuery({
    timeRange,
  });

  if (isLoading) {
    return <AnalyticsLoadingSkeleton />;
  }

  const totalConversations = analytics?.totalConversations || 0;
  const totalMessages = analytics?.totalMessages || 0;
  const avgSessionDuration = analytics?.avgSessionDuration || 0;
  const favoritePersona = analytics?.favoritePersona;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your health conversations and insights
          </p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConversations}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last period
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                Avg {(totalMessages / Math.max(totalConversations, 1)).toFixed(1)} per conversation
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(avgSessionDuration / 60)}m {avgSessionDuration % 60}s
              </div>
              <p className="text-xs text-muted-foreground">
                Per conversation
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Specialist</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {favoritePersona ? (
                <div className="flex items-center space-x-2">
                  {(() => {
                    const Icon = personaIcons[favoritePersona];
                    return <Icon className={`h-6 w-6 ${personaColors[favoritePersona]}`} />;
                  })()}
                  <div>
                    <div className="text-lg font-bold">
                      {favoritePersona.replace('_', ' ')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Most consulted
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-lg text-muted-foreground">
                  No data yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <ConversationMetrics data={conversationStats} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <ResponseTimeGraph data={conversationStats} />
        </motion.div>
      </div>

      {/* Topics Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <PopularTopicsChart data={topicAnalytics} />
      </motion.div>

      {/* Usage Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Usage Patterns</CardTitle>
            <CardDescription>When you typically use TeleHealth AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hour Distribution */}
              <div>
                <h4 className="text-sm font-medium mb-4">Most Active Hours</h4>
                <div className="space-y-2">
                  {analytics?.hourlyDistribution?.map((hour: any) => (
                    <div key={hour.hour} className="flex items-center space-x-2">
                      <span className="text-sm w-12">{hour.hour}:00</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${hour.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">
                        {hour.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day Distribution */}
              <div>
                <h4 className="text-sm font-medium mb-4">Activity by Day</h4>
                <div className="grid grid-cols-7 gap-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                    const dayData = analytics?.weeklyDistribution?.[index] || { count: 0 };
                    const isActive = dayData.count > 0;
                    return (
                      <div
                        key={index}
                        className={`
                          aspect-square rounded-lg border flex items-center justify-center
                          ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                        `}
                      >
                        <span className="text-sm font-medium">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex justify-end space-x-4"
      >
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Schedule Report
        </Button>
        <Button className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Export Analytics
        </Button>
      </motion.div>
    </div>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}