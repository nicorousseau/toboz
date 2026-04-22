import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../App';
import { createSetlistId, loadSetlists, loadSongs, saveSetlists, type Setlist, type Song } from '../utils/storage';

export function SetlistScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [name, setName] = useState('Concert');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    const [s, sl] = await Promise.all([loadSongs(), loadSetlists()]);
    setSongs(s);
    setSetlists(sl);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedIds = useMemo(
    () => songs.filter((s) => selected[s.id]).map((s) => s.id),
    [songs, selected]
  );

  const toggle = (songId: string) => {
    setSelected((m) => ({ ...m, [songId]: !m[songId] }));
  };

  const onCreate = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Setlist vide', 'Sélectionne au moins un morceau.');
      return;
    }
    const newSetlist: Setlist = {
      id: createSetlistId(),
      name: name.trim() || 'Concert',
      songIds: selectedIds,
      updatedAt: Date.now(),
    };
    const next = [newSetlist, ...setlists];
    setSetlists(next);
    await saveSetlists(next);
    setSelected({});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setlist</Text>

      <View style={styles.create}>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Nom de setlist"
          placeholderTextColor="rgba(255,255,255,0.35)"
        />
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onCreate}>
          <Text style={styles.buttonText}>Créer</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Morceaux</Text>
      <FlatList
        data={songs}
        keyExtractor={(s) => s.id}
        style={styles.list}
        renderItem={({ item }) => {
          const isSel = !!selected[item.id];
          return (
            <Pressable style={[styles.row, isSel && styles.rowSelected]} onPress={() => toggle(item.id)}>
              <Text style={styles.rowTitle}>{item.title || 'Sans titre'}</Text>
              <Text style={styles.rowMeta}>{item.artist || '—'}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.subtitle}>Ajoute d’abord des chansons dans “Home”.</Text>}
      />

      <Text style={styles.section}>Setlists enregistrées</Text>
      <FlatList
        data={setlists}
        keyExtractor={(s) => s.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => nav.navigate('SetlistDetail', { setlistId: item.id })}>
            <Text style={styles.rowTitle}>{item.name}</Text>
            <Text style={styles.rowMeta}>{item.songIds.length} morceaux</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.subtitle}>Aucune setlist pour l’instant.</Text>}
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
  title: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#FFF',
    opacity: 0.8,
    marginTop: 8,
    fontSize: 14,
  },
  create: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.04)',
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  buttonPrimary: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  section: {
    marginTop: 18,
    marginBottom: 10,
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  list: {
    maxHeight: 220,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rowSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.08)',
  },
  rowTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  rowMeta: {
    marginTop: 4,
    color: '#FFD700',
    opacity: 0.8,
    fontSize: 12,
    fontWeight: '600',
  },
});

