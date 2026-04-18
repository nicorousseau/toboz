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
    if (isFocused) refresh();
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
    paddingBottom: 12,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  title: {
    color: '#FFD700',
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  headerButtons: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    borderRadius: 10,
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonPrimary: {
    borderColor: '#FFD700',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  songRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  songTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  songArtist: {
    marginTop: 2,
    color: '#FFF',
    opacity: 0.7,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
});

