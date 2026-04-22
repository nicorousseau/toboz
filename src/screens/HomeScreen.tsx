import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, FlatList } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';

import type { RootStackParamList } from '../../App';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { deleteSong, loadSongs, type Song } from '../utils/storage';

export function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const [songs, setSongs] = useState<Song[]>([]);

  const refresh = useCallback(async () => {
    const all = await loadSongs();
    setSongs(all);
  }, []);

  useEffect(() => {
    // Load and merge songs from songs.json on startup
    const initSongs = async () => {
      try {
        const response = await fetch(
          typeof window !== 'undefined' && (window as any).__dirname
            ? '/songs.json'
            : '/toboz/songs.json'
        );
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const existing = await loadSongs();
            const existingIds = new Set(existing.map((s) => s.id));
            
            // Add any new songs from songs.json that don't already exist
            const newSongs = data.filter((song: Song) => !existingIds.has(song.id));
            if (newSongs.length > 0) {
              const { saveSongs } = await import('../utils/storage');
              await saveSongs([...newSongs, ...existing]);
            }
          }
        }
      } catch {
        // Silently fail if songs.json doesn't exist or can't be loaded
      }
      refresh();
    };
    if (isFocused) initSongs();
  }, [isFocused, refresh]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TOBOZ</Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.button} onPress={() => nav.navigate('Setlist')}>
            <Text style={styles.buttonText}>Setlist</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={() => nav.navigate('AddSong')}>
            <Text style={styles.buttonText}>+ Ajouter</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={songs}
        keyExtractor={(s) => s.id}
        contentContainerStyle={songs.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <Text style={styles.subtitle}>
            Aucun morceau. Ajoute-en un avec “+ Ajouter”.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.songRow}
            onPress={() => nav.navigate('Player', { mode: 'single', songId: item.id })}
            onLongPress={() =>
              Alert.alert(item.title || 'Sans titre', 'Que veux-tu faire ?', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Éditer', onPress: () => nav.navigate('AddSong', { songId: item.id }) },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteSong(item.id);
                    refresh();
                  },
                },
              ])
            }
          >
            <Text style={styles.songTitle}>{item.title || 'Sans titre'}</Text>
            <Text style={styles.songArtist}>{item.artist || '—'}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    paddingBottom: 16,
    borderBottomColor: 'rgba(255,215,0,0.15)',
    borderBottomWidth: 2,
    marginBottom: 20,
  },
  title: {
    color: '#FFD700',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(255,215,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.85,
    textAlign: 'center',
    lineHeight: 24,
  },
  headerButtons: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  buttonPrimary: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.08)',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  songRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  songTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  songArtist: {
    marginTop: 4,
    color: '#FFD700',
    opacity: 0.75,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
});

