import guideIntentMap from '../data/guide-intent-map.json';

type IntentEntry = {
  aliases?: string[];
  queries: string[];
};

export function guideSynonymHits(): Array<{ objectID: string; type: 'synonym'; synonyms: string[] }> {
  return Object.entries(guideIntentMap).map(([key, entry]) => {
    const row = entry as IntentEntry;
    return {
      objectID: `sr360-guide-${key}`,
      type: 'synonym' as const,
      synonyms: [...new Set([key, ...(row.aliases || []), ...row.queries].map((term) => term.trim()).filter(Boolean))],
    };
  });
}
