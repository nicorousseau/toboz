import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../App';
import { getSetlistById, loadSongs, upsertSetlist, type Song } from '../utils/storage';

type Route = { key: string; name: 'SetlistEditSongs'; params: { setlistId: string } };

export function SetlistEditSongsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [name, setName] = useState<string>('Setlist');

  const refresh = useCallback(async () => {
    const [sl, allSongs] = await Promise.all([getSetlistById(route.params.setlistId), loadSongs()]);
    setSongs(allSongs);
    setName(sl?.name ?? 'Setlist');
    const map: Record<string, boolean> = {};
    for (const id of sl?.songIds ?? []) map[id] = true;
    setSelected(map);
  }, [route.params.setlistId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedIds = useMemo(() => songs.filter((s) => selected[s.id]).map((s) => s.id), [songs, selected]);

  const toggle = (songId: string) => setSelected((m) => ({ ...m, [songId]: !m[songId] }));

  const onSave = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Setlist vide', 'Sélectionne au moins un morceau.');
      return;
    }
    await upsertSetlist({
      id: route.params.setlistId,
      name,
      songIds: selectedIds,
      updatedAt: Date.now(),
    });
    nav.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Morceaux</Text>
      <Text style={styles.subtitle}>Sélectionne ceux qui doivent être dans “{name}”.</Text>

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

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={() => nav.goBack()}>
          <Text style={styles.buttonText}>Annuler</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onSave}>
          <Text style={styles.buttonText}>Enregistrer</Text>
        </Pressable>
      </View>
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
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: '#FFF',
    opacity: 0.75,
  },
  list: {
    marginTop: 12,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rowSelected: {
    borderColor: '#FFD700',
  },
  rowTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  rowMeta: {
    marginTop: 2,
    color: '#FFF',
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    borderColor: '#FFD700',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '900',
  },
});

