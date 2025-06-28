import { useEffect, useCallback } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

interface UsePerformanceMonitoringOptions {
  onMetric?: (metric: PerformanceMetric) => void;
  reportToAnalytics?: boolean;
  enableConsoleLogging?: boolean;
}

export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    onMetric,
    reportToAnalytics = true,
    enableConsoleLogging = process.env.NODE_ENV === 'development',
  } = options;

  const handleMetric = useCallback((metric: PerformanceMetric) => {
    // Log to console in development
    if (enableConsoleLogging) {
      console.log(`[Performance] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      });
    }

    // Send to analytics service
    if (reportToAnalytics && typeof window !== 'undefined') {
      // Example: Send to Google Analytics
      if ('gtag' in window) {
        (window as any).gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          custom_map: {
            metric_rating: metric.rating,
          },
        });
      }

      // Example: Send to custom analytics
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      }).catch(console.error);
    }

    // Call custom handler
    onMetric?.(metric);
  }, [onMetric, reportToAnalytics, enableConsoleLogging]);

  useEffect(() => {
    // Measure Core Web Vitals
    getCLS(handleMetric);
    getFID(handleMetric);
    getFCP(handleMetric);
    getLCP(handleMetric);
    getTTFB(handleMetric);
  }, [handleMetric]);

  const measureCustomMetric = useCallback((name: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const metric: PerformanceMetric = {
      name,
      value: duration,
      rating: duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor',
      delta: duration,
      id: `${name}-${Date.now()}`,
    };

    handleMetric(metric);
    return duration;
  }, [handleMetric]);

  const measureAsyncOperation = useCallback(async <T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      measureCustomMetric(name, startTime);
      return result;
    } catch (error) {
      measureCustomMetric(`${name}_error`, startTime);
      throw error;
    }
  }, [measureCustomMetric]);

  const measureRender = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      measureCustomMetric(`render_${componentName}`, startTime);
    };
  }, [measureCustomMetric]);

  return {
    measureCustomMetric,
    measureAsyncOperation,
    measureRender,
  };
}