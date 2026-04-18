export type ChordToken = {
  type: 'chord';
  chord: string;
};

export type LyricToken = {
  type: 'lyric';
  text: string;
};

export type Token = ChordToken | LyricToken;

/**
 * Very small ChordPro tokenizer.
 * Example: "[Dm]Hello [G]world" -> chord/lyric/chord/lyric tokens.
 */
export function tokenizeChordPro(input: string): Token[] {
  const tokens: Token[] = [];
  const re = /\[([^\]]+)\]/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'lyric', text: input.slice(lastIndex, match.index) });
    }
    tokens.push({ type: 'chord', chord: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < input.length) {
    tokens.push({ type: 'lyric', text: input.slice(lastIndex) });
  }

  return tokens;
}

export function isTabLine(line: string): boolean {
  return /^(e|B|G|D|A|E)\|/.test(line.trim());
}

