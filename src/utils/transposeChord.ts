const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function noteIndex(note: string): number | null {
  const u = note.toUpperCase();
  const sharpIdx = SHARPS.indexOf(u as (typeof SHARPS)[number]);
  if (sharpIdx >= 0) return sharpIdx;
  const flatIdx = FLATS.indexOf(u as (typeof FLATS)[number]);
  if (flatIdx >= 0) return flatIdx;
  return null;
}

function formatNote(index: number, preferFlats: boolean): string {
  const arr = preferFlats ? FLATS : SHARPS;
  return arr[mod(index, 12)];
}

/**
 * Transpose a chord string by semitones.
 * Supports:
 * - Root chords: "Am", "C#7", "Bbmaj7"
 * - Slash chords: "D/F#", "G/B"
 * Leaves unknown chords unchanged (e.g. "N.C.")
 */
export function transposeChord(chord: string, semitones: number): string {
  const raw = String(chord ?? '').trim();
  if (!raw) return '';
  if (/^N\.?C\.?$/i.test(raw)) return raw;
  if (semitones === 0) return raw;

  const preferFlats = /b/.test(raw) && !/#/.test(raw);

  const transposePart = (part: string) => {
    const m = /^([A-Ga-g])([#b]?)(.*)$/.exec(part);
    if (!m) return part;
    const root = `${m[1].toUpperCase()}${m[2] ?? ''}`;
    const rest = m[3] ?? '';
    const idx = noteIndex(root);
    if (idx == null) return part;
    return `${formatNote(idx + semitones, preferFlats)}${rest}`;
  };

  // Handle slash chords: "D/F#"
  const slashIdx = raw.indexOf('/');
  if (slashIdx >= 0) {
    const a = raw.slice(0, slashIdx);
    const b = raw.slice(slashIdx + 1);
    return `${transposePart(a)}/${transposePart(b)}`;
  }

  return transposePart(raw);
}

