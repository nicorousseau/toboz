import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AddSongScreen } from './src/screens/AddSongScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { SetlistScreen } from './src/screens/SetlistScreen';
import { SetlistDetailScreen } from './src/screens/SetlistDetailScreen';
import { SetlistEditSongsScreen } from './src/screens/SetlistEditSongsScreen';

export type RootStackParamList = {
  Home: undefined;
  AddSong: { songId?: string } | undefined;
  Player:
    | { mode: 'single'; songId: string }
    | { mode: 'concert'; setlistId: string; index: number };
  Setlist: undefined;
  SetlistDetail: { setlistId: string };
  SetlistEditSongs: { setlistId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#FFF',
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'TOBOZ' }} />
        <Stack.Screen name="AddSong" component={AddSongScreen} options={{ title: 'Ajouter' }} />
        <Stack.Screen name="Setlist" component={SetlistScreen} options={{ title: 'Setlist' }} />
        <Stack.Screen name="SetlistDetail" component={SetlistDetailScreen} options={{ title: 'Setlist' }} />
        <Stack.Screen name="SetlistEditSongs" component={SetlistEditSongsScreen} options={{ title: 'Morceaux' }} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{ title: 'Live' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
