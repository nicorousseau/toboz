import AsyncStorage from '@react-native-async-storage/async-storage';

export type Song = {
  id: string;
  title: string;
  artist: string;
  content: string; // ChordPro text
  duration: number; // seconds
  offset: number; // seconds
  fontSize: number;
};

export type Setlist = {
  id: string;
  name: string;
  songIds: string[];
  updatedAt: number;
};

const STORAGE_KEYS = {
  songs: 'toboz:songs:v1',
  setlists: 'toboz:setlists:v1',
} as const;

export async function loadSongs(): Promise<Song[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.songs);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Song[]) : [];
  } catch {
    return [];
  }
}

export async function saveSongs(songs: Song[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.songs, JSON.stringify(songs));
}

export async function getSongById(songId: string): Promise<Song | undefined> {
  const songs = await loadSongs();
  return songs.find((s) => s.id === songId);
}

export async function upsertSong(song: Song): Promise<void> {
  const songs = await loadSongs();
  const idx = songs.findIndex((s) => s.id === song.id);
  if (idx >= 0) songs[idx] = song;
  else songs.unshift(song);
  await saveSongs(songs);
}

export async function deleteSong(songId: string): Promise<void> {
  const songs = await loadSongs();
  await saveSongs(songs.filter((s) => s.id !== songId));
}

export async function loadSetlists(): Promise<Setlist[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.setlists);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Setlist[]) : [];
  } catch {
    return [];
  }
}

export async function saveSetlists(setlists: Setlist[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.setlists, JSON.stringify(setlists));
}

export async function getSetlistById(setlistId: string): Promise<Setlist | undefined> {
  const setlists = await loadSetlists();
  return setlists.find((s) => s.id === setlistId);
}

export async function upsertSetlist(setlist: Setlist): Promise<void> {
  const all = await loadSetlists();
  const idx = all.findIndex((s) => s.id === setlist.id);
  const next: Setlist = { ...setlist, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  await saveSetlists(all);
}

export async function deleteSetlist(setlistId: string): Promise<void> {
  const all = await loadSetlists();
  await saveSetlists(all.filter((s) => s.id !== setlistId));
}

export function createSetlistId(): string {
  return `setlist_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function createSongId(): string {
  // Avoids extra dependencies; good enough for local-only IDs.
  return `song_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

