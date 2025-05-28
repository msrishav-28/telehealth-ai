/**
 * PII (Personally Identifiable Information) Filter
 * Removes sensitive information from user messages
 */

export class PIIFilter {
  private patterns: Map<string, RegExp>;

  constructor() {
    this.patterns = new Map([
      // US Social Security Number
      ['ssn', /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g],
      
      // Credit Card Numbers (basic patterns)
      ['creditCard', /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g],
      
      // Email Addresses
      ['email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g],
      
      // Phone Numbers (US format)
      ['phone', /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g],
      
      // IP Addresses
      ['ip', /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g],
      
      // Date of Birth (various formats)
      ['dob', /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g],
      
      // Driver's License (generic pattern)
      ['license', /\b[A-Z]{1,2}\d{5,8}\b/g],
      
      // Passport Numbers
      ['passport', /\b[A-Z]{1,2}\d{6,9}\b/g],
      
      // Medical Record Numbers (generic)
      ['mrn', /\bMRN[\s:]*\d{6,10}\b/gi],
      
      // Insurance ID
      ['insurance', /\b[A-Z]{3}\d{9}\b/g],
    ]);
  }

  /**
   * Filter PII from text
   */
  async filter(text: string): Promise<string> {
    let filteredText = text;
    const detectedTypes: string[] = [];

    // Apply each pattern
    for (const [type, pattern] of this.patterns) {
      const matches = filteredText.match(pattern);
      if (matches && matches.length > 0) {
        detectedTypes.push(type);
        filteredText = filteredText.replace(pattern, this.getReplacement(type));
      }
    }

    // Filter potential names (simple heuristic)
    filteredText = this.filterNames(filteredText);

    // Filter addresses
    filteredText = this.filterAddresses(filteredText);

    // Log if PII was detected (for audit purposes)
    if (detectedTypes.length > 0) {
      console.log('PII detected and filtered:', detectedTypes);
    }

    return filteredText;
  }

  /**
   * Get replacement text for different PII types
   */
  private getReplacement(type: string): string {
    const replacements: Record<string, string> = {
      ssn: '[SSN_REMOVED]',
      creditCard: '[CARD_REMOVED]',
      email: '[EMAIL_REMOVED]',
      phone: '[PHONE_REMOVED]',
      ip: '[IP_REMOVED]',
      dob: '[DATE_REMOVED]',
      license: '[LICENSE_REMOVED]',
      passport: '[PASSPORT_REMOVED]',
      mrn: '[MRN_REMOVED]',
      insurance: '[INSURANCE_ID_REMOVED]',
    };
    return replacements[type] || '[PII_REMOVED]';
  }

  /**
   * Filter potential names (basic implementation)
   */
  private filterNames(text: string): string {
    // Look for patterns like "My name is John Smith" or "I am Jane Doe"
    const namePatterns = [
      /\b(?:my name is|i am|i'm|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/gi,
      /\b(?:patient|client|user):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/gi,
    ];

    let filtered = text;
    for (const pattern of namePatterns) {
      filtered = filtered.replace(pattern, (match, name) => {
        return match.replace(name, '[NAME_REMOVED]');
      });
    }

    return filtered;
  }

  /**
   * Filter addresses (basic implementation)
   */
  private filterAddresses(text: string): string {
    // Look for patterns that might be addresses
    const addressPattern = /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Plaza|Pl)\b/gi;
    
    return text.replace(addressPattern, '[ADDRESS_REMOVED]');
  }

  /**
   * Check if text contains PII without filtering
   */
  async containsPII(text: string): Promise<boolean> {
    for (const [, pattern] of this.patterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get detailed PII detection report
   */
  async detectPII(text: string): Promise<{
    hasPII: boolean;
    types: string[];
    count: number;
  }> {
    const detectedTypes: string[] = [];
    let count = 0;

    for (const [type, pattern] of this.patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        detectedTypes.push(type);
        count += matches.length;
      }
    }

    return {
      hasPII: detectedTypes.length > 0,
      types: detectedTypes,
      count,
    };
  }
}