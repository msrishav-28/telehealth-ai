import { Persona } from '@prisma/client';
import { KeywordMatcher } from './keyword-matcher';

type EmergencySeverity = 'normal' | 'urgent' | 'emergency';

const keywordMap: Record<Persona, string[]> = {
  [Persona.PSYCHIATRIST]: ['depressed', 'depression', 'anxiety', 'panic', 'bipolar', 'adhd', 'medication', 'psychiatric'],
  [Persona.ALLERGIST]: ['allergy', 'allergies', 'asthma', 'hives', 'anaphylaxis', 'peanut', 'immune', 'rash'],
  [Persona.GERIATRICIAN]: ['dementia', 'elderly', 'memory loss', 'fall prevention', 'seniors', 'medicare', '75', 'aging'],
  [Persona.DERMATOLOGIST]: ['acne', 'mole', 'eczema', 'hair loss', 'nail fungus', 'skin', 'rash'],
  [Persona.PSYCHOLOGIST]: ['therapy', 'counseling', 'coping', 'behavioral', 'stress management', 'relationship'],
};

const emergencyKeywords = ['chest pain', 'cant breathe', "can't breathe", 'suicidal', 'severe bleeding', 'stroke', 'heart attack'];
const urgentKeywords = ['severe headache', 'high fever', 'difficulty swallowing'];

export class PersonaRouter {
  private matcher = new KeywordMatcher();

  async routeToPersona(message: string) {
    const emergency = await this.detectEmergency(message);
    const scores = Object.entries(keywordMap).map(([persona, keywords]) => {
      const matches = this.matcher.matchKeywords(message, keywords, { fuzzy: true });
      return { persona: persona as Persona, score: matches.length, matches };
    });
    const suggestedPersonas = scores.filter((score) => score.score > 0).map((score) => score.persona);
    const best = scores.sort((a, b) => b.score - a.score)[0];
    const confidence = best.score > 0 ? Math.min(0.95, 0.75 + best.score * 0.05) : 0.2;

    return {
      persona: best.score > 0 ? best.persona : Persona.PSYCHIATRIST,
      confidence,
      suggestedPersonas: suggestedPersonas.length > 0 ? suggestedPersonas : Object.values(Persona),
      isEmergency: emergency.isEmergency,
      emergencyAction: emergency.isEmergency ? 'alert' : undefined,
      emergencyResources: emergency.isEmergency ? { phoneNumbers: emergency.severity === 'emergency' && message.toLowerCase().includes('suicidal') ? ['988', '911'] : ['911'] } : undefined,
    };
  }

  async detectEmergency(message: string): Promise<{ isEmergency: boolean; severity: EmergencySeverity }> {
    const lower = message.toLowerCase();
    if (emergencyKeywords.some((keyword) => lower.includes(keyword))) {
      return { isEmergency: true, severity: 'emergency' };
    }
    if (urgentKeywords.some((keyword) => lower.includes(keyword))) {
      return { isEmergency: false, severity: 'urgent' };
    }
    return { isEmergency: false, severity: 'normal' };
  }
}
