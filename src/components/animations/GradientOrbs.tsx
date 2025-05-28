'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function GradientOrbs() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const orbs = container.querySelectorAll('.orb');
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.01;
        const x = (clientX / innerWidth - 0.5) * speed * 100;
        const y = (clientY / innerHeight - 0.5) * speed * 100;
        
        (orb as HTMLElement).style.transform = `translate(${x}px, ${y}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <motion.div
        className="orb absolute h-96 w-96 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-3xl"
        initial={{ x: '-50%', y: '-50%' }}
        animate={{
          x: ['0%', '100%', '0%'],
          y: ['0%', '100%', '0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ left: '20%', top: '20%' }}
      />
      <motion.div
        className="orb absolute h-96 w-96 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl"
        initial={{ x: '-50%', y: '-50%' }}
        animate={{
          x: ['100%', '0%', '100%'],
          y: ['0%', '100%', '0%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ right: '20%', top: '30%' }}
      />
      <motion.div
        className="orb absolute h-96 w-96 rounded-full bg-gradient-to-r from-pink-500/30 to-orange-500/30 blur-3xl"
        initial={{ x: '-50%', y: '-50%' }}
        animate={{
          x: ['0%', '100%', '0%'],
          y: ['100%', '0%', '100%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ left: '50%', bottom: '20%' }}
      />
    </div>
  );
}