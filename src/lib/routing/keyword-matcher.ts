export type MatchOptions = {
  fuzzy?: boolean;
  useSynonyms?: boolean;
  synonymMap?: Record<string, string[]>;
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(text: string) {
  return new Set(normalize(text).split(' ').filter(Boolean));
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, (_, row) => Array.from({ length: b.length + 1 }, (_, col) => (row === 0 ? col : col === 0 ? row : 0)));
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

export class KeywordMatcher {
  matchKeywords(text: string, keywords: string[], options: MatchOptions = {}) {
    const normalizedText = normalize(text);
    const textWords = Array.from(tokens(text));

    return keywords.filter((keyword) => {
      const normalizedKeyword = normalize(keyword);
      if (normalizedText.includes(normalizedKeyword)) return true;

      if (options.useSynonyms) {
        const synonyms = options.synonymMap?.[keyword] ?? [];
        if (synonyms.some((synonym) => normalizedText.includes(normalize(synonym)))) return true;
      }

      if (options.fuzzy) {
        return textWords.some((word) => {
          if (word.includes(normalizedKeyword) || normalizedKeyword.includes(word)) return true;
          const distance = levenshtein(word, normalizedKeyword);
          return distance <= Math.max(2, Math.floor(normalizedKeyword.length * 0.35));
        });
      }

      return false;
    });
  }

  calculateSimilarity(text1: string, text2: string) {
    const a = tokens(text1);
    const b = tokens(text2);
    if (a.size === 0 && b.size === 0) return 1;
    const intersection = Array.from(a).filter((item) => b.has(item)).length;
    return (2 * intersection) / (a.size + b.size);
  }
}
