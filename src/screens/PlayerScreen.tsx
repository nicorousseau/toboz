import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useKeepAwake } from 'expo-keep-awake';

import type { RootStackParamList } from '../../App';
import { getSongById, loadSetlists, loadSongs, type Song } from '../utils/storage';
import { parseChordPro } from '../utils/chordParser';
import { transposeChord } from '../utils/transposeChord';

type PlayerRoute =
  | { key: string; name: 'Player'; params: { mode: 'single'; songId: string } }
  | { key: string; name: 'Player'; params: { mode: 'concert'; setlistId: string; index: number } };

export function PlayerScreen() {
  useKeepAwake();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PlayerRoute>();
  const [song, setSong] = useState<Song | null>(null);
  const [concert, setConcert] = useState<{
    setlistId: string;
    index: number;
    songIds: string[];
    titlesById: Record<string, string>;
  } | null>(null);
  const [fontSize, setFontSize] = useState<number>(22);
  const [isPlaying, setIsPlaying] = useState(false);
  const [locked, setLocked] = useState(false);
  const [unlockHoldMs, setUnlockHoldMs] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [transposeSemitones, setTransposeSemitones] = useState(0);
  const unlockHoldStartRef = useRef<number | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const [contentHeight, setContentHeight] = useState(1);
  const [viewportHeight, setViewportHeight] = useState(1);
  const [scrollY, setScrollY] = useState(0);
  const currentYRef = useRef(0);
  const lastTickTsRef = useRef<number | null>(null);
  const offsetStartTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const loadSingle = useCallback(async (songId: string) => {
    const s = await getSongById(songId);
    setSong(s ?? null);
    if (s?.fontSize) setFontSize(s.fontSize);
  }, []);

  const loadConcert = useCallback(async (setlistId: string, index: number) => {
    const [setlists, songs] = await Promise.all([loadSetlists(), loadSongs()]);
    const sl = setlists.find((s) => s.id === setlistId);
    const ids = sl?.songIds ?? [];
    const titlesById: Record<string, string> = {};
    for (const s of songs) titlesById[s.id] = s.title || 'Sans titre';

    const safeIndex = Math.max(0, Math.min(index, Math.max(0, ids.length - 1)));
    setConcert({ setlistId, index: safeIndex, songIds: ids, titlesById });
    const currentId = ids[safeIndex];
    if (currentId) await loadSingle(currentId);
    else setSong(null);
  }, [loadSingle]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (route.params.mode === 'single') {
        setConcert(null);
        await loadSingle(route.params.songId);
      } else {
        await loadConcert(route.params.setlistId, route.params.index);
      }
    })().catch(() => {
      if (!cancelled) setSong(null);
    });
    return () => {
      cancelled = true;
    };
  }, [loadConcert, loadSingle, route.params]);

  const parsed = useMemo(() => parseChordPro(song?.content ?? ''), [song?.content]);

  const maxScroll = Math.max(0, contentHeight - viewportHeight);
  const duration = Math.max(1, song?.duration ?? 1);
  const offset = Math.max(0, song?.offset ?? 0);
  const baseSpeedPxPerSec = (maxScroll / Math.max(1, duration - offset)) * 1.4;
  const speedPxPerSec = baseSpeedPxPerSec * speedMultiplier;

  const stop = () => {
    setIsPlaying(false);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTickTsRef.current = null;
    offsetStartTsRef.current = null;
  };

  const reset = () => {
    stop();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    currentYRef.current = 0;
    setScrollY(0);
  };

  const goToConcertIndex = async (nextIndex: number) => {
    if (!concert) return;
    stop();
    reset();
    await loadConcert(concert.setlistId, nextIndex);
  };

  const hasPrev = concert ? concert.index > 0 : false;
  const hasNext = concert ? concert.index < concert.songIds.length - 1 : false;
  const nextTitle =
    concert && hasNext ? concert.titlesById[concert.songIds[concert.index + 1]] ?? '' : '';

  useEffect(() => {
    if (!isPlaying) return;

    const offsetMs = offset * 1000;

    const tick = (ts: number) => {
      if (!isPlaying) return;

      // Handle offset (intro) timing.
      if (offsetStartTsRef.current == null) offsetStartTsRef.current = ts;
      const sinceStart = ts - offsetStartTsRef.current;
      if (sinceStart < offsetMs) {
        lastTickTsRef.current = ts;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const lastTs = lastTickTsRef.current ?? ts;
      const dtSec = Math.max(0, (ts - lastTs) / 1000);
      lastTickTsRef.current = ts;

      const nextY = Math.min(maxScroll, currentYRef.current + dtSec * speedPxPerSec);
      currentYRef.current = nextY;
      scrollRef.current?.scrollTo({ y: nextY, animated: false });

      if (nextY >= maxScroll) {
        stop();
        // Auto-next / end-of-concert behavior.
        if (concert) {
          if (hasNext) {
            // Move to next song and auto-resume.
            goToConcertIndex(concert.index + 1).then(() => setIsPlaying(true));
          } else {
            // End of concert: go back to setlist detail.
            nav.navigate('SetlistDetail', { setlistId: concert.setlistId });
          }
        }
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // Ensure refs start from current position.
    currentYRef.current = scrollY;
    lastTickTsRef.current = null;
    offsetStartTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, maxScroll, speedPxPerSec, offset, concert, hasNext, goToConcertIndex, nav, scrollY]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setScrollY(y);
    currentYRef.current = y;
  };

  const transposeLabel =
    transposeSemitones === 0 ? 'Transpo 0' : `Transpo ${transposeSemitones > 0 ? '+' : ''}${transposeSemitones}`;

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) clearInterval(unlockTimerRef.current);
    };
  }, []);

  return (
    <View style={styles.container} onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}>
      <View style={styles.topBar}>
        <Pressable style={styles.homeButton} onPress={() => nav.navigate('Home')}>
          <Text style={styles.homeButtonText}>TOBOZ</Text>
        </Pressable>
        <Text style={styles.songTitle} numberOfLines={1}>
          {song?.title || 'Sans titre'}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {song?.artist || ''}
        </Text>
        <Text style={styles.speedLabel}>Vitesse x{speedMultiplier.toFixed(1)}</Text>
        <Text style={styles.speedLabel}>{transposeLabel}</Text>
      </View>

      <ScrollView
        ref={(r) => {
          scrollRef.current = r;
        }}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!locked}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onContentSizeChange={(_, h) => setContentHeight(h)}
      >
        {parsed.lines.map((line, idx) => {
          if (line.type === 'empty') {
            return <View key={`l_${idx}`} style={{ height: Math.round(fontSize * 0.9) }} />;
          }

          if (line.type === 'tab') {
            return (
              <Text key={`l_${idx}`} style={[styles.tabLine, { fontSize: Math.max(12, fontSize - 6) }]}>
                {line.raw}
              </Text>
            );
          }

          return (
            <View key={`l_${idx}`} style={styles.lyricLine}>
              {line.cells.map((cell, cIdx) => (
                <View key={`c_${idx}_${cIdx}`} style={styles.cell}>
                  <Text style={[styles.chord, { fontSize: Math.max(12, fontSize - 6) }]}>
                    {cell.chord ? transposeChord(cell.chord, transposeSemitones) : ' '}
                  </Text>
                  <Text style={[styles.lyric, { fontSize }]}>{cell.lyric || ' '}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {concert && nextTitle ? (
        <View style={styles.nextHint}>
          <Text style={styles.nextHintLabel}>Suivant</Text>
          <Text style={styles.nextHintTitle} numberOfLines={1}>
            {nextTitle}
          </Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        {concert ? (
          <Pressable
            style={[styles.ctrlBtn, (locked || !hasPrev) && styles.ctrlBtnDisabled]}
            onPress={() => goToConcertIndex((concert?.index ?? 0) - 1)}
            disabled={locked || !hasPrev}
          >
            <Text style={styles.ctrlText}>Préc.</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.ctrlBtn, locked && styles.ctrlBtnDisabled]}
          onPress={() => setFontSize((s) => Math.max(14, s - 2))}
          disabled={locked}
        >
          <Text style={styles.ctrlText}>A-</Text>
        </Pressable>
        <Pressable style={[styles.ctrlBtn, locked && styles.ctrlBtnDisabled]} onPress={reset} disabled={locked}>
          <Text style={styles.ctrlText}>Reset</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, styles.ctrlPrimary, locked && styles.ctrlBtnDisabled]}
          onPress={() => setIsPlaying((p) => !p)}
          disabled={locked}
        >
          <Text style={styles.ctrlText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, locked && styles.ctrlBtnDisabled]}
          onPress={() => setFontSize((s) => Math.min(48, s + 2))}
          disabled={locked}
        >
          <Text style={styles.ctrlText}>A+</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, locked && styles.ctrlBtnDisabled]}
          onPress={() => setSpeedMultiplier((m) => Math.max(0.5, Number((m - 0.1).toFixed(1))))}
          disabled={locked}
        >
          <Text style={styles.ctrlText}>V-</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, locked && styles.ctrlBtnDisabled]}
          onPress={() => setSpeedMultiplier((m) => Math.min(3, Number((m + 0.1).toFixed(1))))}
          disabled={locked}
        >
          <Text style={styles.ctrlText}>V+</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, locked && styles.ctrlBtnDisabled]}
          onPress={() => setTransposeSemitones((t) => Math.max(-12, t - 1))}
          disabled={locked}
        >
          <Text style={styles.ctrlText}>T-</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, locked && styles.ctrlBtnDisabled]}
          onPress={() => setTransposeSemitones((t) => Math.min(12, t + 1))}
          disabled={locked}
        >
          <Text style={styles.ctrlText}>T+</Text>
        </Pressable>
        {concert ? (
          <Pressable
            style={[styles.ctrlBtn, (locked || !hasNext) && styles.ctrlBtnDisabled]}
            onPress={() => goToConcertIndex((concert?.index ?? 0) + 1)}
            disabled={locked || !hasNext}
          >
            <Text style={styles.ctrlText}>Suiv.</Text>
          </Pressable>
        ) : null}
      </View>

      {locked ? (
        <View style={styles.lockOverlay} pointerEvents="auto">
          <Text style={styles.lockTitle}>Écran verrouillé</Text>
          <Text style={styles.lockHint}>Maintiens pour déverrouiller</Text>
          <Pressable
            style={styles.unlockButton}
            onPressIn={() => {
              unlockHoldStartRef.current = Date.now();
              if (unlockTimerRef.current) clearInterval(unlockTimerRef.current);
              unlockTimerRef.current = setInterval(() => {
                const start = unlockHoldStartRef.current ?? Date.now();
                setUnlockHoldMs(Date.now() - start);
              }, 50);
            }}
            onPressOut={() => {
              if (unlockTimerRef.current) clearInterval(unlockTimerRef.current);
              unlockTimerRef.current = null;
              const start = unlockHoldStartRef.current ?? Date.now();
              const held = Date.now() - start;
              unlockHoldStartRef.current = null;
              if (held >= 2000) setLocked(false);
              setUnlockHoldMs(0);
            }}
          >
            <Text style={styles.unlockText}>Déverrouiller ({Math.min(2, unlockHoldMs / 1000).toFixed(1)}s)</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomColor: 'rgba(255,215,0,0.15)',
    borderBottomWidth: 1.5,
  },
  homeButton: {
    marginBottom: 10,
  },
  homeButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  songTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  songArtist: {
    marginTop: 4,
    color: '#FFF',
    opacity: 0.8,
    fontSize: 14,
    fontWeight: '600',
  },
  speedLabel: {
    marginTop: 8,
    color: '#FFF',
    opacity: 0.75,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  lyricLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  cell: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  chord: {
    color: '#FFD700',
    fontWeight: '900',
    lineHeight: 18,
    fontSize: 12,
  },
  lyric: {
    color: '#FFF',
    fontWeight: '700',
    lineHeight: 30,
  },
  tabLine: {
    color: '#FFF',
    fontFamily: 'Courier',
    opacity: 0.9,
    marginBottom: 8,
    fontSize: 11,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    borderTopColor: 'rgba(255,215,0,0.15)',
    borderTopWidth: 1.5,
    backgroundColor: '#000',
  },
  ctrlBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  ctrlBtnDisabled: {
    opacity: 0.35,
  },
  ctrlPrimary: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  ctrlLock: {
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ctrlLockActive: {
    borderColor: '#FFD700',
  },
  ctrlText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },
  nextHint: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 74,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  nextHintLabel: {
    color: '#FFF',
    opacity: 0.7,
    fontWeight: '700',
    fontSize: 12,
  },
  nextHintTitle: {
    marginTop: 2,
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 14,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockTitle: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: '900',
  },
  lockHint: {
    marginTop: 10,
    color: '#FFF',
    opacity: 0.8,
  },
  unlockButton: {
    marginTop: 18,
    borderRadius: 14,
    borderColor: '#FFD700',
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  unlockText: {
    color: '#FFF',
    fontWeight: '900',
  },
});

