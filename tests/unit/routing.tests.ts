import { describe, it, expect } from '@jest/globals';
import { PersonaRouter } from '@/lib/routing/persona-router';
import { KeywordMatcher } from '@/lib/routing/keyword-matcher';
import { Persona } from '@prisma/client';

describe('PersonaRouter', () => {
  let router: PersonaRouter;

  beforeEach(() => {
    router = new PersonaRouter();
  });

  describe('routeToPersona', () => {
    it('should route mental health keywords to psychiatrist', async () => {
      const testCases = [
        'I feel depressed',
        'anxiety attacks',
        'bipolar disorder',
        'ADHD medication',
        'panic disorder',
      ];

      for (const message of testCases) {
        const result = await router.routeToPersona(message);
        expect(result.persona).toBe(Persona.PSYCHIATRIST);
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should route allergy keywords to allergist', async () => {
      const testCases = [
        'peanut allergy',
        'seasonal allergies',
        'asthma attack',
        'hives and rash',
        'anaphylaxis',
      ];

      for (const message of testCases) {
        const result = await router.routeToPersona(message);
        expect(result.persona).toBe(Persona.ALLERGIST);
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should route aging-related keywords to geriatrician', async () => {
      const testCases = [
        'dementia symptoms',
        'elderly parent care',
        'memory loss at 75',
        'fall prevention for seniors',
        'medicare questions',
      ];

      for (const message of testCases) {
        const result = await router.routeToPersona(message);
        expect(result.persona).toBe(Persona.GERIATRICIAN);
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should route skin conditions to dermatologist', async () => {
      const testCases = [
        'acne treatment',
        'suspicious mole',
        'eczema flare up',
        'hair loss',
        'nail fungus',
      ];

      for (const message of testCases) {
        const result = await router.routeToPersona(message);
        expect(result.persona).toBe(Persona.DERMATOLOGIST);
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should route therapy-related keywords to psychologist', async () => {
      const testCases = [
        'need therapy',
        'relationship counseling',
        'coping strategies',
        'behavioral issues',
        'stress management techniques',
      ];

      for (const message of testCases) {
        const result = await router.routeToPersona(message);
        expect(result.persona).toBe(Persona.PSYCHOLOGIST);
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should handle ambiguous queries with lower confidence', async () => {
      const result = await router.routeToPersona('I dont feel well');
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.suggestedPersonas).toHaveLength(5);
    });

    it('should detect multiple relevant personas', async () => {
      const result = await router.routeToPersona('anxiety and skin rash');
      expect(result.suggestedPersonas).toContain(Persona.PSYCHIATRIST);
      expect(result.suggestedPersonas).toContain(Persona.DERMATOLOGIST);
    });
  });

  describe('detectEmergency', () => {
    it('should detect emergency keywords', async () => {
      const emergencies = [
        'chest pain cant breathe',
        'suicidal thoughts',
        'severe bleeding',
        'stroke symptoms',
        'heart attack',
      ];

      for (const message of emergencies) {
        const result = await router.detectEmergency(message);
        expect(result.isEmergency).toBe(true);
        expect(result.severity).toBe('emergency');
      }
    });

    it('should detect urgent but non-emergency situations', async () => {
      const urgent = [
        'severe headache for 3 days',
        'high fever',
        'difficulty swallowing',
      ];

      for (const message of urgent) {
        const result = await router.detectEmergency(message);
        expect(result.severity).toBe('urgent');
      }
    });

    it('should not flag non-emergency messages', async () => {
      const normal = [
        'mild headache',
        'seasonal allergies',
        'acne treatment',
      ];

      for (const message of normal) {
        const result = await router.detectEmergency(message);
        expect(result.isEmergency).toBe(false);
        expect(result.severity).toBe('normal');
      }
    });
  });
});

describe('KeywordMatcher', () => {
  let matcher: KeywordMatcher;

  beforeEach(() => {
    matcher = new KeywordMatcher();
  });

  describe('matchKeywords', () => {
    it('should match exact keywords', () => {
      const keywords = ['depression', 'anxiety', 'therapy'];
      const text = 'I have been dealing with depression and anxiety';
      
      const matches = matcher.matchKeywords(text, keywords);
      expect(matches).toContain('depression');
      expect(matches).toContain('anxiety');
      expect(matches).not.toContain('therapy');
    });

    it('should match with case insensitivity', () => {
      const keywords = ['ADHD', 'medication'];
      const text = 'My child has adhd and needs Medication';
      
      const matches = matcher.matchKeywords(text, keywords);
      expect(matches).toHaveLength(2);
    });

    it('should match partial words with fuzzy matching', () => {
      const keywords = ['psychiatric', 'psychology'];
      const text = 'I need a psychiatrist or psychologist';
      
      const matches = matcher.matchKeywords(text, keywords, { fuzzy: true });
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should handle synonyms', () => {
      const keywords = ['sad'];
      const text = 'I feel depressed and unhappy';
      
      const matches = matcher.matchKeywords(text, keywords, { 
        useSynonyms: true,
        synonymMap: { sad: ['depressed', 'unhappy'] }
      });
      expect(matches).toContain('sad');
    });
  });

  describe('calculateSimilarity', () => {
    it('should calculate similarity between texts', () => {
      const text1 = 'anxiety and depression';
      const text2 = 'depression and anxiety disorder';
      
      const similarity = matcher.calculateSimilarity(text1, text2);
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('should return low similarity for different texts', () => {
      const text1 = 'skin rash';
      const text2 = 'mental health';
      
      const similarity = matcher.calculateSimilarity(text1, text2);
      expect(similarity).toBeLessThan(0.3);
    });
  });
});

describe('Emergency Detection', () => {
  it('should prioritize emergency routing', async () => {
    const router = new PersonaRouter();
    const result = await router.routeToPersona('chest pain and depression');
    
    expect(result.isEmergency).toBe(true);
    expect(result.emergencyAction).toBe('alert');
  });

  it('should include emergency resources', async () => {
    const router = new PersonaRouter();
    const result = await router.routeToPersona('suicidal thoughts');
    
    expect(result.emergencyResources).toBeDefined();
    expect(result.emergencyResources?.phoneNumbers).toContain('988');
  });
});