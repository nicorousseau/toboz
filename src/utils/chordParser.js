/**
 * ChordPro-ish parser for React Native rendering.
 *
 * Input example:
 *   "[Dm]Hello [G]world"
 *
 * Output line example:
 *   { type: 'lyric', cells: [ { chord: 'Dm', lyric: 'Hello ' }, { chord: 'G', lyric: 'world' } ] }
 *
 * The idea is simple: render each cell as a small column (chord on top, lyric below).
 * This avoids fragile "space padding" alignment and works with flex layouts.
 */

const CHORD_RE = /\[([^\]]+)\]/g;
const TAB_RE = /^(e|B|G|D|A|E)\|/;

/**
 * @typedef {{ chord: string, lyric: string }} ChordCell
 *
 * @typedef {{ type: 'lyric', raw: string, cells: ChordCell[] }} LyricLine
 * @typedef {{ type: 'tab', raw: string }} TabLine
 * @typedef {{ type: 'empty', raw: '' }} EmptyLine
 *
 * @typedef {LyricLine | TabLine | EmptyLine} ParsedLine
 *
 * @typedef {{ lines: ParsedLine[] }} ParsedChordPro
 */

/**
 * Parse a whole ChordPro content string into render-friendly lines.
 * - Keeps line breaks
 * - Converts literal /n strings to actual newlines
 * - Detects tablature lines (`e|`, `B|`, ...)
 * - Ignores ChordPro directives like `{title: ...}` by treating them as plain text (for now)
 *
 * @param {string} content
 * @returns {ParsedChordPro}
 */
export function parseChordPro(content) {
  const withActualNewlines = String(content ?? '').replace(/\\n/g, '\n').replace(/\/n/g, '\n');
  const normalized = withActualNewlines.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');

  return {
    lines: rawLines.map(parseLine),
  };
}

/**
 * Parse a single line into either:
 * - tab line
 * - empty line
 * - lyric line with chord cells
 *
 * @param {string} raw
 * @returns {ParsedLine}
 */
export function parseLine(raw) {
  const line = String(raw ?? '');
  if (line.length === 0) return { type: 'empty', raw: '' };
  if (TAB_RE.test(line.trim())) return { type: 'tab', raw: line };

  const cells = parseChordCells(line);
  return { type: 'lyric', raw: line, cells };
}

/**
 * Convert a ChordPro inline-chord line into cells.
 *
 * Rules:
 * - Chord applies starting at the current lyric position.
 * - Multiple consecutive chords before any lyric are collapsed to the last chord.
 * - If a chord appears at end-of-line, we keep it in a final empty-lyric cell.
 *
 * @param {string} line
 * @returns {ChordCell[]}
 */
export function parseChordCells(line) {
  /** @type {ChordCell[]} */
  const cells = [];

  let pendingChord = '';
  let lastIndex = 0;

  /** @type {RegExpExecArray | null} */
  let match;
  CHORD_RE.lastIndex = 0;

  while ((match = CHORD_RE.exec(line)) !== null) {
    const lyricChunk = line.slice(lastIndex, match.index);
    if (lyricChunk.length > 0 || pendingChord) {
      cells.push({ chord: pendingChord, lyric: lyricChunk });
      pendingChord = '';
    } else if (pendingChord) {
      // If we have a pending chord with no lyric, add a space before the next chord
      cells.push({ chord: pendingChord, lyric: ' ' });
      pendingChord = '';
    }

    // Chords can be empty or weird; normalize to trimmed string.
    pendingChord = String(match[1] ?? '').trim();
    lastIndex = match.index + match[0].length;
  }

  const tail = line.slice(lastIndex);
  if (tail.length > 0 || pendingChord || cells.length === 0) {
    cells.push({ chord: pendingChord, lyric: tail });
  }

  // Add space before capital letters that start a new chord (e.g., "DmCadd9" -> "Dm Cadd9")
  return cells.map((c, idx) => {
    const chord = c.chord || '';
    const lyric = c.lyric || '';
    
    // If the lyric starts with a capital letter and it's not just whitespace, 
    // it might be a chord that got concatenated. Add space.
    if (lyric && /^[A-G]/.test(lyric) && lyric.trim()) {
      return { chord, lyric: ' ' + lyric };
    }
    
    return { chord, lyric };
  });
}

