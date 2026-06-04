'use client';

import { Brain, Heart, Shield, Sparkles, Sun } from 'lucide-react';
import { Persona } from '@prisma/client';
import { getAllPersonas } from '@/lib/personas/base';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const icons = { PSYCHIATRIST: Brain, ALLERGIST: Shield, GERIATRICIAN: Heart, DERMATOLOGIST: Sun, PSYCHOLOGIST: Sparkles } as const;

interface PersonaSelectorProps {
  selected?: Persona;
  onSelect: (persona: Persona) => void;
}

export function PersonaSelector({ selected, onSelect }: PersonaSelectorProps) {
  return (
    <Select value={selected} onValueChange={(value) => onSelect(value as Persona)}>
      <SelectTrigger className="w-[260px]">
        <SelectValue placeholder="Select a specialist" />
      </SelectTrigger>
      <SelectContent>
        {getAllPersonas().map((persona) => {
          const Icon = icons[persona.id];
          return (
            <SelectItem key={persona.id} value={persona.id}>
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {persona.title}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
