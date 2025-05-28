/**
 * Content Moderator for medical chat safety
 * Works with Gemini's built-in safety features
 */

interface ModerationResult {
  blocked: boolean;
  flagged: boolean;
  reason?: string;
  categories?: string[];
}

export class ContentModerator {
  private bannedTerms: Set<string>;
  private medicalMisinformationTerms: Set<string>;

  constructor() {
    // Terms that should block the message entirely
    this.bannedTerms = new Set([
      // Add specific banned terms if needed
      'illegal drugs',
      'self-harm instructions',
      'suicide methods',
    ]);

    // Terms that might indicate medical misinformation
    this.medicalMisinformationTerms = new Set([
      'cure-all',
      'miracle cure',
      'doctors hate this',
      'big pharma conspiracy',
      'vaccines cause autism',
      'essential oils cure cancer',
    ]);
  }

  /**
   * Moderate content for safety and appropriateness
   */
  async moderate(content: string): Promise<ModerationResult> {
    const lowerContent = content.toLowerCase();
    const categories: string[] = [];

    // Check for banned terms
    for (const term of this.bannedTerms) {
      if (lowerContent.includes(term)) {
        return {
          blocked: true,
          flagged: true,
          reason: `Content contains prohibited term: ${term}`,
          categories: ['banned_content'],
        };
      }
    }

    // Check for medical misinformation
    let misinfoCount = 0;
    for (const term of this.medicalMisinformationTerms) {
      if (lowerContent.includes(term)) {
        misinfoCount++;
        categories.push('potential_misinformation');
      }
    }

    // Block if too many misinformation terms
    if (misinfoCount >= 2) {
      return {
        blocked: true,
        flagged: true,
        reason: 'Content may contain medical misinformation',
        categories,
      };
    }

    // Flag but don't block single misinformation terms
    if (misinfoCount === 1) {
      return {
        blocked: false,
        flagged: true,
        reason: 'Content flagged for review',
        categories,
      };
    }

    // Check for overly promotional content
    const promotionalPatterns = [
      /buy now/i,
      /limited time offer/i,
      /click here to purchase/i,
      /discount code/i,
    ];

    for (const pattern of promotionalPatterns) {
      if (pattern.test(content)) {
        categories.push('promotional');
        return {
          blocked: false,
          flagged: true,
          reason: 'Promotional content detected',
          categories,
        };
      }
    }

    // Check for personal information patterns
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{16}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    ];

    for (const pattern of piiPatterns) {
      if (pattern.test(content)) {
        categories.push('pii');
        return {
          blocked: false,
          flagged: true,
          reason: 'Personal information detected',
          categories,
        };
      }
    }

    // Content passed all checks
    return {
      blocked: false,
      flagged: false,
    };
  }

  /**
   * Check if response contains appropriate medical disclaimers
   */
  checkMedicalDisclaimer(content: string): boolean {
    const disclaimerPhrases = [
      'consult a healthcare professional',
      'not a substitute for medical advice',
      'speak with your doctor',
      'seek medical attention',
      'educational purposes only',
    ];

    const lowerContent = content.toLowerCase();
    return disclaimerPhrases.some(phrase => lowerContent.includes(phrase));
  }

  /**
   * Add safety disclaimer if missing
   */
  ensureSafetyDisclaimer(content: string): string {
    if (this.checkMedicalDisclaimer(content)) {
      return content;
    }

    // Add disclaimer at the end
    return `${content}\n\n*Remember: This information is for educational purposes only and is not a substitute for professional medical advice. Always consult with a healthcare provider for medical concerns.*`;
  }
}