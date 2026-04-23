import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../App';
import {
  deleteSetlist,
  getSetlistById,
  loadSongs,
  saveSetlists,
  upsertSetlist,
  type Setlist,
  type Song,
} from '../utils/storage';

type Route = { key: string; name: 'SetlistDetail'; params: { setlistId: string } };

type Row = {
  songId: string;
  title: string;
  artist: string;
};

export function SetlistDetailScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [songsById, setSongsById] = useState<Record<string, Song>>({});
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [songOrder, setSongOrder] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const [sl, songs] = await Promise.all([getSetlistById(route.params.setlistId), loadSongs()]);
    setSetlist(sl ?? null);
    setName(sl?.name ?? '');
    setSongOrder(sl?.songIds ?? []);
    const map: Record<string, Song> = {};
    for (const s of songs) map[s.id] = s;
    setSongsById(map);
  }, [route.params.setlistId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const data: Row[] = useMemo(() => {
    return songOrder
      .map((songId) => {
        const s = songsById[songId];
        return {
          songId,
          title: s?.title || 'Sans titre',
          artist: s?.artist || '—',
        };
      })
      .filter(Boolean);
  }, [songOrder, songsById]);

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...songOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setSongOrder(newOrder);
    if (setlist) {
      upsertSetlist({ ...setlist, songIds: newOrder, updatedAt: Date.now() });
    }
  };

  const moveDown = (index: number) => {
    if (index >= songOrder.length - 1) return;
    const newOrder = [...songOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setSongOrder(newOrder);
    if (setlist) {
      upsertSetlist({ ...setlist, songIds: newOrder, updatedAt: Date.now() });
    }
  };

  const renderItem = ({ item, index }: { item: Row; index: number }) => (
    <View style={styles.rowWithButtons}>
      <Pressable
        style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
        onPress={() => moveUp(index)}
        disabled={index === 0}
      >
        <Text style={styles.arrowText}>↑</Text>
      </Pressable>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowMeta}>{item.artist}</Text>
      </View>
      <Pressable
        style={[styles.arrowBtn, index === data.length - 1 && styles.arrowBtnDisabled]}
        onPress={() => moveDown(index)}
        disabled={index === data.length - 1}
      >
        <Text style={styles.arrowText}>↓</Text>
      </Pressable>
    </View>
  );

  if (!setlist) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Setlist introuvable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {editingName ? (
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.nameInput}
            placeholder="Nom de setlist"
            placeholderTextColor="rgba(255,255,255,0.35)"
          />
        ) : (
          <Text style={styles.title}>{setlist.name}</Text>
        )}
        <View style={styles.actions}>
          <Pressable
            style={styles.button}
            onPress={() => {
              if (!editingName) {
                setEditingName(true);
                return;
              }
              const trimmed = name.trim() || 'Setlist';
              setEditingName(false);
              upsertSetlist({ ...setlist, name: trimmed, updatedAt: Date.now() }).then(refresh);
            }}
          >
            <Text style={styles.buttonText}>{editingName ? 'OK' : 'Renommer'}</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => nav.navigate('SetlistEditSongs', { setlistId: setlist.id })}
          >
            <Text style={styles.buttonText}>Morceaux</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => nav.navigate('Player', { mode: 'concert', setlistId: setlist.id, index: 0 })}
          >
            <Text style={styles.buttonText}>Démarrer</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonDanger]}
            onPress={() =>
              Alert.alert('Supprimer la setlist ?', 'Cette action est définitive.', [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteSetlist(setlist.id);
                      nav.goBack();
                    } catch (error) {
                      Alert.alert('Erreur', 'Impossible de supprimer la setlist.');
                    }
                  },
                },
              ])
            }
          >
            <Text style={styles.buttonText}>Suppr.</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.hint}>Utilise les flèches pour réorganiser.</Text>

      <FlatList
        data={data}
        keyExtractor={(i) => i.songId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '900',
  },
  nameInput: {
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.03)',
    fontWeight: '900',
    fontSize: 18,
  },
  subtitle: {
    color: '#FFF',
    opacity: 0.8,
  },
  actions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  buttonPrimary: {
    borderColor: '#FFD700',
  },
  buttonDanger: {
    borderColor: 'rgba(255,80,80,0.9)',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '900',
  },
  hint: {
    color: '#FFF',
    opacity: 0.7,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  rowWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  rowContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderColor: '#FFD700',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  arrowBtnDisabled: {
    opacity: 0.3,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  arrowText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '900',
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
});

