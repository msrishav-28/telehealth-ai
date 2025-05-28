'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Persona {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  color: string;
}

interface FloatingCardsProps {
  personas: Persona[];
}

export function FloatingCards({ personas }: FloatingCardsProps) {
  return (
    <div className="relative w-full h-full">
      {personas.map((persona, index) => {
        const angle = (index / personas.length) * 2 * Math.PI;
        const radius = 150;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={persona.id}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: x,
              y: y,
            }}
            transition={{
              duration: 0.8,
              delay: index * 0.1,
              ease: 'easeOut',
            }}
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3 + index,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Card className="p-4 w-48 cursor-pointer hover:shadow-xl transition-shadow">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${persona.color} mb-3`}>
                  <persona.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{persona.name}</h3>
                <p className="text-xs text-muted-foreground">{persona.description}</p>
              </Card>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}