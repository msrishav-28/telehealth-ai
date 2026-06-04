import { z } from 'zod';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { TRPCError } from '@trpc/server';
import { Citation } from '@/types/chat.types';
import crypto from 'crypto';

const PERPLEXITY_API_URL = process.env.PERPLEXITY_API_URL || 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const CACHE_TTL = 3600; // 1 hour in seconds

// Response schemas
const PerplexityCitationSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  score: z.number().optional(),
  source: z.string().optional(),
});

const PerplexityResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: z.object({
      role: z.string(),
      content: z.string(),
    }),
    finish_reason: z.string().nullable(),
  })),
  citations: z.array(PerplexityCitationSchema).optional(),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }).optional(),
});

export class PerplexityService {
  private redis?: Redis;
  private rateLimiter?: Ratelimit;

  constructor() {
    try {
      this.redis = Redis.fromEnv();
      this.rateLimiter = new Ratelimit({
        redis: this.redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
      });
    } catch {
      this.redis = undefined;
      this.rateLimiter = undefined;
    }
  }

  /**
   * Generate a cache key for the query
   */
  private getCacheKey(query: string, options?: any): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ query, options }))
      .digest('hex');
    return `perplexity:${hash}`;
  }

  /**
   * Search for medical information using Perplexity API
   */
  async searchMedical(
    query: string,
    options: {
      maxResults?: number;
      sources?: string[];
      recency?: 'day' | 'week' | 'month' | 'year';
    } = {},
    rateLimitKey = 'anonymous'
  ): Promise<{
    content: string;
    citations: Citation[];
  }> {
    if (this.rateLimiter) {
      const { success } = await this.rateLimiter.limit(rateLimitKey);
      if (!success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Please try again later.',
        });
      }
    }

    const cacheKey = this.getCacheKey(query, options);
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return cached as { content: string; citations: Citation[] };
      }
    }

    if (!PERPLEXITY_API_KEY) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Perplexity API key not configured',
      });
    }

    try {
      // Prepare the search query with medical context
      const enhancedQuery = this.enhanceQueryForMedical(query, options);

      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'pplx-7b-online', // or 'pplx-70b-online' for better quality
          messages: [
            {
              role: 'system',
              content: `You are a medical information assistant. Provide accurate, evidence-based information from reputable medical sources. Always include citations for your claims. Focus on peer-reviewed journals, government health agencies (NIH, CDC, WHO), and established medical institutions.`,
            },
            {
              role: 'user',
              content: enhancedQuery,
            },
          ],
          max_tokens: 1000,
          temperature: 0.2, // Lower temperature for more factual responses
          top_p: 0.9,
          return_citations: true,
          search_domain_filter: options.sources || [
            'pubmed.ncbi.nlm.nih.gov',
            'cdc.gov',
            'who.int',
            'mayoclinic.org',
            'nih.gov',
            'webmd.com',
            'healthline.com',
            'medicalnewstoday.com',
          ],
          search_recency_filter: options.recency || 'year',
        }),
      });

      if (!response.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Perplexity API error: ${response.statusText}`,
        });
      }

      const data = await response.json();
      const parsed = PerplexityResponseSchema.parse(data);

      const content = parsed.choices[0]?.message.content || '';
      const citations = this.processCitations(parsed.citations || []);

      const result = { content, citations };

      if (this.redis) {
        await this.redis.set(cacheKey, result, { ex: CACHE_TTL });
      }

      return result;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      console.error('Perplexity API error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to search medical information',
      });
    }
  }

  /**
   * Check drug interactions using Perplexity
   */
  async checkDrugInteractions(drugs: string[], rateLimitKey?: string): Promise<{
    interactions: Array<{
      drugs: string[];
      severity: 'minor' | 'moderate' | 'major';
      description: string;
      recommendation: string;
    }>;
    citations: Citation[];
  }> {
    const query = `Check for drug interactions between: ${drugs.join(', ')}. Include severity levels and recommendations.`;
    
    const result = await this.searchMedical(query, {
      sources: [
        'drugs.com',
        'rxlist.com',
        'medscape.com',
        'ncbi.nlm.nih.gov',
      ],
    }, rateLimitKey ?? 'drug-interactions');

    // Parse the response to extract structured interaction data
    const interactions = this.parseInteractionsFromContent(result.content, drugs);

    return {
      interactions,
      citations: result.citations,
    };
  }

  /**
   * Get symptom information
   */
  async getSymptomInfo(symptom: string, context?: {
    age?: number;
    gender?: string;
    medications?: string[];
  }, rateLimitKey?: string): Promise<{
    overview: string;
    possibleCauses: string[];
    whenToSeekHelp: string[];
    homeRemedies: string[];
    citations: Citation[];
  }> {
    let query = `Provide comprehensive information about the symptom: ${symptom}.`;
    
    if (context) {
      if (context.age) query += ` Patient age: ${context.age}.`;
      if (context.gender) query += ` Gender: ${context.gender}.`;
      if (context.medications?.length) {
        query += ` Current medications: ${context.medications.join(', ')}.`;
      }
    }
    
    query += ` Include possible causes, when to seek medical help, and safe home remedies.`;

    const result = await this.searchMedical(query, {}, rateLimitKey ?? 'symptom-info');

    // Parse structured information from the content
    return {
      overview: this.extractSection(result.content, 'overview'),
      possibleCauses: this.extractList(result.content, 'possible causes'),
      whenToSeekHelp: this.extractList(result.content, 'seek help'),
      homeRemedies: this.extractList(result.content, 'home remedies'),
      citations: result.citations,
    };
  }

  /**
   * Enhance query with medical context
   */
  private enhanceQueryForMedical(query: string, options: any): string {
    let enhanced = query;

    // Add instruction to cite sources
    enhanced += '\n\nPlease provide citations from reputable medical sources for all claims.';

    // Add recency requirement if specified
    if (options.recency) {
      enhanced += `\n\nFocus on information from the last ${options.recency}.`;
    }

    // Add source preference if specified
    if (options.sources?.length) {
      enhanced += `\n\nPrioritize information from: ${options.sources.join(', ')}.`;
    }

    return enhanced;
  }

  /**
   * Process citations from Perplexity response
   */
  private processCitations(citations: z.infer<typeof PerplexityCitationSchema>[]): Citation[] {
    return citations.map((citation, index) => ({
      id: `citation-${index}`,
      title: citation.title,
      url: citation.url,
      snippet: citation.snippet,
      relevanceScore: citation.score || 0.8,
      source: this.extractSourceName(citation.url),
    }));
  }

  /**
   * Extract source name from URL
   */
  private extractSourceName(url: string): string {
    try {
      const domain = new URL(url).hostname;
      const sourceMappings: Record<string, string> = {
        'pubmed.ncbi.nlm.nih.gov': 'PubMed',
        'cdc.gov': 'CDC',
        'who.int': 'WHO',
        'mayoclinic.org': 'Mayo Clinic',
        'nih.gov': 'NIH',
        'webmd.com': 'WebMD',
        'healthline.com': 'Healthline',
        'medicalnewstoday.com': 'Medical News Today',
        'drugs.com': 'Drugs.com',
        'rxlist.com': 'RxList',
        'medscape.com': 'Medscape',
      };
      
      for (const [key, value] of Object.entries(sourceMappings)) {
        if (domain.includes(key)) return value;
      }
      
      return domain;
    } catch {
      return 'Medical Source';
    }
  }

  /**
   * Parse drug interactions from content
   */
  private parseInteractionsFromContent(content: string, drugs: string[]) {
    // This is a simplified parser - in production, you'd want more sophisticated NLP
    const interactions = [];
    
    const severityKeywords = {
      major: ['major', 'severe', 'dangerous', 'life-threatening'],
      moderate: ['moderate', 'significant', 'monitor closely'],
      minor: ['minor', 'mild', 'low risk'],
    };

    // Simple parsing logic - would be more sophisticated in production
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const drug1 = drugs[i];
        const drug2 = drugs[j];
        
        // Check if interaction is mentioned
        if (content.toLowerCase().includes(drug1.toLowerCase()) && 
            content.toLowerCase().includes(drug2.toLowerCase())) {
          
          let severity: 'minor' | 'moderate' | 'major' = 'minor';
          
          // Determine severity
          for (const [level, keywords] of Object.entries(severityKeywords)) {
            if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
              severity = level as 'minor' | 'moderate' | 'major';
              break;
            }
          }
          
          interactions.push({
            drugs: [drug1, drug2],
            severity,
            description: `Potential interaction between ${drug1} and ${drug2}`,
            recommendation: 'Consult your healthcare provider',
          });
        }
      }
    }
    
    return interactions;
  }

  /**
   * Extract a section from content
   */
  private extractSection(content: string, section: string): string {
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex(line => 
      line.toLowerCase().includes(section.toLowerCase())
    );
    
    if (sectionIndex === -1) return '';
    
    let result = '';
    for (let i = sectionIndex + 1; i < lines.length; i++) {
      if (lines[i].trim() === '' || lines[i].match(/^#+\s/)) break;
      result += lines[i] + '\n';
    }
    
    return result.trim();
  }

  /**
   * Extract a list from content
   */
  private extractList(content: string, section: string): string[] {
    const sectionContent = this.extractSection(content, section);
    const lines = sectionContent.split('\n');
    
    return lines
      .filter(line => line.match(/^[-*•]\s/) || line.match(/^\d+\.\s/))
      .map(line => line.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '').trim())
      .filter(Boolean);
  }
}