import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Footer from '../components/Footer';
import Header from '../components/Header';
import colors from '../theme/colors';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/** Pega só o primeiro termo: "Toronto, ON, Canadá" -> "Toronto" */
function firstToken(label = '') {
  return label.split(',')[0].trim();
}

export default function SearchScreen() {
  const [qText, setQText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedCity, setSelectedCity] = useState('');
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // cache de usuários: { [uid]: { name, photoURL? } }
  const [usersMap, setUsersMap] = useState({});

  // mesma leitura da PublishScreen (app.json → expo.extra.googleMapsApiKey)
  const googleMapsApiKey =
    (Constants?.expoConfig?.extra && Constants.expoConfig.extra.googleMapsApiKey) ||
    (Constants?.manifest?.extra && Constants.manifest.extra.googleMapsApiKey) ||
    '';

  // Debounce das sugestões (só busca quando está focado e há 2+ chars)
  useEffect(() => {
    const text = qText.trim();
    if (!showSuggestions || text.length < 2) return;
    const t = setTimeout(() => fetchCities(text), 300);
    return () => clearTimeout(t);
  }, [qText, showSuggestions]);

  async function fetchCities(text) {
    if (!googleMapsApiKey) {
      console.warn('[SearchScreen] googleMapsApiKey ausente no app.json → expo.extra.googleMapsApiKey');
      return;
    }
    try {
      setLoadingSug(true);
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        `input=${encodeURIComponent(text)}&types=(cities)&language=pt-BR&key=${googleMapsApiKey}`;

      const res = await fetch(url);
      const json = await res.json();
      const list = (json?.predictions || []).map((p) => p.description);
      setSuggestions(list);
    } catch (e) {
      console.log('[SearchScreen] erro ao buscar cidades:', e);
    } finally {
      setLoadingSug(false);
    }
  }

  /** Seleção de cidade: fecha lista, fixa texto e busca no Firestore por city == primeiro termo */
  async function onSelectCity(label) {
    try {
      const cityOnly = firstToken(label); // Firestore salva "Toronto"
      setShowSuggestions(false);
      setSuggestions([]);
      setQText(label);
      setSelectedCity(label);
      Keyboard.dismiss();

      setLoadingPosts(true);

      // Busca por city == "Toronto"
      const qCity = query(collection(db, 'posts'), where('city', '==', cityOnly));
      const snap = await getDocs(qCity);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      // Ordena localmente por createdAt desc (Timestamp ou número)
      list.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
        return tb - ta;
      });

      setPosts(list);

      // Busca dados dos autores (nome/foto) e atualiza o cache
      const uniqueIds = Array.from(new Set(list.map((p) => p.userId).filter(Boolean)));
      const missing = uniqueIds.filter((uid) => !usersMap[uid]);

      if (missing.length) {
        const entries = await Promise.all(
          missing.map(async (uid) => {
            try {
              const uref = doc(db, 'users', uid);
              const usnap = await getDoc(uref);
              if (usnap.exists()) {
                const udata = usnap.data();
                return [
                  uid,
                  {
                    name: udata?.name || udata?.displayName || 'Usuário',
                    photoURL: udata?.photoURL || udata?.avatarUri || null,
                  },
                ];
              }
              return [uid, { name: 'Usuário', photoURL: null }];
            } catch (e) {
              console.log('[SearchScreen] erro carregando usuário', uid, e);
              return [uid, { name: 'Usuário', photoURL: null }];
            }
          })
        );

        setUsersMap((prev) => {
          const next = { ...prev };
          entries.forEach(([uid, val]) => (next[uid] = val));
          return next;
        });
      }
    } catch (e) {
      console.log('[SearchScreen] erro ao buscar posts:', e);
      Alert.alert('Erro', 'Não foi possível carregar as publicações desta cidade.');
    } finally {
      setLoadingPosts(false);
    }
  }

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity style={styles.suggestion} onPress={() => onSelectCity(item)}>
      <Ionicons name="location-outline" size={18} color="#000" />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header />

      <View style={styles.container}>
        {/* Barra de busca */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#555" style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Digite o nome da cidade..."
            placeholderTextColor="#888"
            value={qText}
            onChangeText={(t) => {
              setQText(t);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (qText.trim().length >= 2) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 120);
            }}
            style={styles.input}
          />
        </View>

        {/* Sugestões (só quando digitando) */}
        {showSuggestions ? (
          loadingSug ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : suggestions.length > 0 ? (
            <FlatList
              style={styles.suggestionsList}
              data={suggestions}
              keyExtractor={(item) => item}
              renderItem={renderSuggestion}
              keyboardShouldPersistTaps="handled"
            />
          ) : null
        ) : null}

        {/* Resultados */}
        <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
          {selectedCity ? (
            <Text style={styles.resultTitle}>
              Resultados em <Text style={styles.resultCity}>{selectedCity}</Text>
            </Text>
          ) : null}

          {loadingPosts ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : posts.length > 0 ? (
            <View style={{ gap: 12 }}>
              {posts.map((p) => (
                <PostCard key={p.id} item={p} author={usersMap[p.userId]} />
              ))}
            </View>
          ) : selectedCity ? (
            <Text style={styles.empty}>Nenhuma publicação encontrada para essa cidade.</Text>
          ) : null}
        </ScrollView>
      </View>

      <Footer />
    </SafeAreaView>
  );
}

/** Card de publicação (com foto e nome do autor, localização e dados do post) */
function PostCard({ item, author }) {
  const img = item.photoUrl || item.imageURL || item.photoURL || null;
  const desc = item.description || '';
  const exp = item.experience || '';
  const loc = [item.city, item.state, item.country].filter(Boolean).join(' — ');
  const authorName = author?.name || 'Usuário';
  const avatar = author?.photoURL || null;

  return (
    <View style={styles.postCard}>
      {/* Cabeçalho com autor */}
      <View style={styles.postHeader}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.authorAvatar} />
        ) : (
          <Ionicons name="person-circle" size={32} color={colors.primary} />
        )}
        <View>
          <Text style={styles.postUser}>{authorName}</Text>
          {loc ? <Text style={styles.postLocSmall}>{loc}</Text> : null}
        </View>
      </View>

      {/* Imagem (só se existir) */}
      {img && <Image source={{ uri: img }} style={styles.postImage} />}

      {/* Campos */}
      {desc ? (
        <View style={styles.postField}>
          <Text style={styles.fieldLabel}>Descrição</Text>
          <Text style={styles.fieldText}>{desc}</Text>
        </View>
      ) : null}

      {exp ? (
        <View style={styles.postField}>
          <Text style={styles.fieldLabel}>Experiência</Text>
          <Text style={styles.fieldText}>{exp}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CFCFCF',
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10, color: '#000' },

  suggestionsList: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: 220,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  suggestionText: { marginLeft: 8, fontSize: 15, color: '#000' },

  resultTitle: { marginTop: 16, marginBottom: 8, fontSize: 14, color: '#666' },
  resultCity: { fontWeight: '800', color: colors.primary },
  empty: { textAlign: 'center', color: '#666', marginTop: 18 },

  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  postUser: { fontWeight: '700', color: colors.primary, fontSize: 15 },
  postLocSmall: { fontSize: 11, color: '#666' },

  postImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    backgroundColor: '#EEE',
    marginBottom: 10,
  },

  postField: { marginTop: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#333', marginBottom: 2 },
  fieldText: { fontSize: 14, color: '#222', lineHeight: 20 },
});
