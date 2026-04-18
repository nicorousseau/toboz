import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';

import type { RootStackParamList } from '../../App';
import { createSongId, getSongById, upsertSong, type Song } from '../utils/storage';

export function AddSongScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<{ key: string; name: 'AddSong'; params?: { songId?: string } }>();
  const editingSongId = route.params?.songId;
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [duration, setDuration] = useState('240');
  const [offset, setOffset] = useState('0');
  const [fontSize, setFontSize] = useState('22');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!editingSongId) return;
    let cancelled = false;
    (async () => {
      const s = await getSongById(editingSongId);
      if (!s || cancelled) return;
      setTitle(s.title ?? '');
      setArtist(s.artist ?? '');
      setDuration(String(s.duration ?? 240));
      setOffset(String(s.offset ?? 0));
      setFontSize(String(s.fontSize ?? 22));
      setContent(s.content ?? '');
    })();
    return () => {
      cancelled = true;
    };
  }, [editingSongId]);

  const onImportClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (!text) {
      Alert.alert('Presse-papier vide', 'Copie des paroles (ChordPro) puis réessaie.');
      return;
    }
    setContent(text);
  };

  const onSave = async () => {
    const song: Song = {
      id: editingSongId ?? createSongId(),
      title: title.trim(),
      artist: artist.trim(),
      content: content,
      duration: Math.max(1, Number(duration) || 1),
      offset: Math.max(0, Number(offset) || 0),
      fontSize: Math.max(12, Number(fontSize) || 22),
    };

    await upsertSong(song);
    nav.navigate('Player', { mode: 'single', songId: song.id });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{editingSongId ? 'Éditer le morceau' : 'Nouveau morceau'}</Text>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Titre</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Wonderwall"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Artiste</Text>
          <TextInput
            value={artist}
            onChangeText={setArtist}
            placeholder="Ex: Oasis"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Durée (s)</Text>
          <TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" style={styles.input} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Offset (s)</Text>
          <TextInput value={offset} onChangeText={setOffset} keyboardType="number-pad" style={styles.input} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Taille</Text>
          <TextInput value={fontSize} onChangeText={setFontSize} keyboardType="number-pad" style={styles.input} />
        </View>
      </View>

      <View style={styles.field}>
        <View style={styles.contentHeader}>
          <Text style={styles.label}>Paroles / Accords (ChordPro)</Text>
          <Pressable style={styles.smallButton} onPress={onImportClipboard}>
            <Text style={styles.smallButtonText}>Importer presse-papier</Text>
          </Pressable>
        </View>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="[Dm]Hello [G]world…"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={[styles.input, styles.textArea]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={() => nav.goBack()}>
          <Text style={styles.buttonText}>Annuler</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onSave}>
          <Text style={styles.buttonText}>Enregistrer</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  field: {
    flex: 1,
    gap: 8,
  },
  label: {
    color: '#FFF',
    opacity: 0.85,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  textArea: {
    minHeight: 260,
    fontFamily: 'Courier',
    fontSize: 14,
    lineHeight: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  smallButton: {
    borderRadius: 10,
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  smallButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
    opacity: 0.9,
  },
  actions: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
    fontWeight: '700',
  },
});

