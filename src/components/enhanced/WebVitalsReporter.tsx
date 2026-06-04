'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(metric.name, metric.value);
    }
  });

  return null;
}
