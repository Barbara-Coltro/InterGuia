import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { auth, db, storage } from '../lib/firebase';
import colors from '../theme/colors';

export default function PublishScreen() {
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);

  // conteúdo
  const [desc, setDesc] = useState('');

  // cidade (com controle de seleção)
  const [cityQuery, setCityQuery] = useState('');
  const [selectedCityLabel, setSelectedCityLabel] = useState('');
  const [loc, setLoc] = useState({ city: '', state: '', country: '' });

  // sugestões
  const [suggestions, setSuggestions] = useState([]);
  const [loadingCity, setLoadingCity] = useState(false);
  const [cityError, setCityError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // foto do post
  const [photo, setPhoto] = useState(null);

  // estado de postagem
  const [posting, setPosting] = useState(false);

  // carrega dados do usuário logado (para mostrar no topo do card)
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    (async () => {
      try {
        const ref = doc(db, 'users', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserName(data?.name || data?.displayName || 'Usuário');
          setUserAvatar(data?.photoURL || data?.avatarUri || null);
        } else {
          setUserName('Usuário');
          setUserAvatar(null);
        }
      } catch {
        setUserName('Usuário');
        setUserAvatar(null);
      }
    })();
  }, []);

  // busca de cidade (aparece só quando digitando e com 2+ chars)
  useEffect(() => {
    setCityError('');
    setSuggestions([]);

    const q = cityQuery.trim();
    if (!showSuggestions || q.length < 2) return;

    const t = setTimeout(() => lookupCity(q), 300);
    return () => clearTimeout(t);
  }, [cityQuery, showSuggestions]);

  async function lookupCity(query) {
    const key =
      Constants?.expoConfig?.extra?.googleMapsApiKey ||
      Constants?.manifest?.extra?.googleMapsApiKey;
    if (!key) {
      setCityError('Chave do Google não configurada.');
      return;
    }

    try {
      setLoadingCity(true);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&language=pt-BR&key=${key}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.status !== 'OK' || !json.results?.length) {
        setCityError('Cidade não encontrada.');
        return;
      }

      const parse = (r) => {
        const comp = r.address_components || [];
        const city =
          getComponent(comp, 'locality') ||
          getComponent(comp, 'administrative_area_level_2') ||
          getComponent(comp, 'postal_town') ||
          '';
        const state = getComponent(comp, 'administrative_area_level_1') || '';
        const country = getComponent(comp, 'country') || '';
        const formatted = r.formatted_address || [city, state, country].filter(Boolean).join(', ');
        if (!country) return null;
        return { city, state, country, formatted };
      };

      const list = json.results
        .map(parse)
        .filter(Boolean)
        .reduce((acc, cur) => {
          if (!acc.find((x) => x.formatted === cur.formatted)) acc.push(cur);
          return acc;
        }, [])
        .slice(0, 5);

      setSuggestions(list);
    } catch {
      setCityError('Erro ao procurar a cidade.');
    } finally {
      setLoadingCity(false);
    }
  }

  function getComponent(components, type) {
    const item = components.find((c) => c.types?.includes(type));
    return item?.long_name || '';
  }

  async function pickImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permissão necessária', 'Autorize o acesso às imagens.');
        return;
      }

      // Compatível com seu SDK (o novo enum pode dar erro dependendo da versão)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [16, 9],
        base64: false,
      });

      if (!result.canceled && result.assets?.length) {
        const a = result.assets[0];
        setPhoto({ uri: a.uri });
      }
    } catch (e) {
      console.log('[Publish] erro no picker:', e);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  }

  function removePhoto() {
    setPhoto(null);
  }

  function onSelectSuggestion(item) {
    setLoc({ city: item.city, state: item.state, country: item.country });
    setCityQuery(item.formatted);
    setSelectedCityLabel(item.formatted); // guarda o label escolhido
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
  }

  /** Upload de foto igual cadastro/perfil: fetch(uri) -> blob -> uploadBytes */
  async function uploadPhotoIfNeeded(uri) {
    if (!uri) return null;
    try {
      // tenta inferir contentType pela extensão
      const lower = uri.split('?')[0].toLowerCase();
      const inferred =
        lower.endsWith('.png') ? 'image/png' :
        lower.endsWith('.webp') ? 'image/webp' :
        lower.endsWith('.heic') ? 'image/heic' : 'image/jpeg';

      console.log('[Publish] preparando blob p/ uploadBytes...', { uri, inferred });

      const res = await fetch(uri);
      const blob = await res.blob(); // ✅ Expo retorna Blob válido aqui
      const contentType = blob.type || inferred;

      const uid = auth.currentUser?.uid || 'anon';
      const ext =
        contentType === 'image/png' ? 'png' :
        contentType === 'image/webp' ? 'webp' :
        contentType === 'image/heic' ? 'heic' : 'jpg';

      const filename = `${Date.now()}.${ext}`;
      const path = `posts/${uid}/${filename}`;
      const sref = storageRef(storage, path);

      await uploadBytes(sref, blob, { contentType });
      const url = await getDownloadURL(sref);
      console.log('[Publish] upload OK, url:', url);
      return url;
    } catch (e) {
      console.log('[Publish] falha no upload (blob):', e);
      return null;
    }
  }

  async function onPost() {
    if (posting) return;
    if (!desc.trim()) {
      Alert.alert('Informe a descrição', 'Conte um pouco da sua experiência.');
      return;
    }
    if (!loc.city) {
      Alert.alert('Informe a cidade', 'Escolha uma cidade nas sugestões.');
      return;
    }

    try {
      setPosting(true);

      // upload opcional da foto
      const photoUrl = await uploadPhotoIfNeeded(photo?.uri);

      // cria documento no Firestore
      const uid = auth.currentUser?.uid || null;
      await addDoc(collection(db, 'posts'), {
        userId: uid,
        description: desc.trim(),
        city: loc.city,           // SearchScreen usa where('city','==', city)
        state: loc.state,
        country: loc.country,
        photoUrl: photoUrl || null,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
  'Publicado!',
  'Seu post foi criado com sucesso.',
  [{ text: 'OK', onPress: () => router.replace('/profile') }]
);

      // limpa o form
      setDesc('');
      setCityQuery('');
      setSelectedCityLabel('');
      setLoc({ city: '', state: '', country: '' });
      setPhoto(null);
    } catch (e) {
      console.log('[Publish] erro ao publicar:', e);
      Alert.alert('Erro', 'Não foi possível publicar seu post. Tente novamente.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* CARD (tamanho reduzido/ornamentado) */}
          <View style={styles.card}>
            {/* Cabeçalho do card: avatar + nome */}
            <View style={styles.cardHeader}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.avatar} />
              ) : (
                <Ionicons name="person-circle" size={48} color={colors.primary} />
              )}
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.userName}>{userName}</Text>
                {loc.city ? (
                  <Text style={styles.userLoc}>
                    {loc.city} — {loc.state} — {loc.country}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Descrição */}
            <Text style={styles.label}>Descreva sua experiência</Text>
            <TextInput
              value={desc}
              onChangeText={setDesc}
              placeholder="Descreva sua experiência..."
              placeholderTextColor="#777"
              multiline
              style={[styles.input, styles.textarea]}
            />

            {/* Cidade */}
            <Text style={[styles.label, { marginTop: 12 }]}>Adicione a Cidade</Text>
            <TextInput
              value={cityQuery}
              onChangeText={(t) => {
                setCityQuery(t);
                setShowSuggestions(true);
                if (t !== selectedCityLabel) {
                  setLoc({ city: '', state: '', country: '' });
                }
              }}
              onFocus={() => {
                if (cityQuery.trim().length >= 2) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 120);
              }}
              placeholder="Ex.: São Paulo, Madrid, Paris…"
              placeholderTextColor="#777"
              style={styles.input}
            />

            {/* Sugestões */}
            {showSuggestions ? (
              loadingCity ? (
                <View style={styles.row}>
                  <ActivityIndicator />
                  <Text style={styles.info}>Buscando cidades…</Text>
                </View>
              ) : cityError ? (
                <Text style={[styles.info, { color: '#E53935' }]}>{cityError}</Text>
              ) : suggestions.length > 0 ? (
                <View style={styles.suggestList}>
                  {suggestions.map((item) => (
                    <TouchableOpacity
                      key={item.formatted}
                      style={styles.suggestItem}
                      onPress={() => onSelectSuggestion(item)}
                    >
                      <Text style={styles.suggestText}>{item.formatted}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null
            ) : null}

            {/* Foto */}
            <Text style={[styles.label, { marginTop: 12 }]}>Foto (opcional)</Text>
            <View style={styles.photoRow}>
              <TouchableOpacity style={[styles.input, styles.inputPicker]} onPress={pickImage} activeOpacity={0.9}>
                <Ionicons name="image-outline" size={18} color={colors.primary} />
                <Text style={styles.inputPickerText}>
                  {photo?.uri ? 'Trocar foto…' : 'Selecionar foto…'}
                </Text>
              </TouchableOpacity>

              {photo?.uri ? (
                <TouchableOpacity style={[styles.smallBtn, styles.btnDanger]} onPress={removePhoto}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.smallBtnTextPrimary}>Remover</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {photo?.uri ? <Image source={{ uri: photo.uri }} style={styles.preview} /> : null}

            {/* Postar */}
            <TouchableOpacity
              style={[styles.postBtn, posting && { opacity: 0.6 }]}
              onPress={onPost}
              activeOpacity={0.9}
              disabled={posting}
            >
              {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>Postar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

/* estilos */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },

  container: { paddingHorizontal: 12, paddingTop: 10 },

  // CARD com tamanho reduzido (não full height)
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#eee' },
  userName: { fontWeight: '800', color: colors.primary, fontSize: 16 },
  userLoc: { fontSize: 11, color: '#666' },

  label: { color: '#B23C9A', fontWeight: '800', marginBottom: 6 },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  textarea: { minHeight: 140, textAlignVertical: 'top' },

  inputPicker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputPickerText: { color: colors.primary, fontWeight: '800' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  info: { marginTop: 6, color: '#333' },

  suggestList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    overflow: 'hidden',
  },
  suggestItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  suggestText: { color: '#333' },

  // foto: linha com seletor + remover
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // preview
  preview: { marginTop: 10, width: '100%', height: 180, borderRadius: 12, backgroundColor: '#EEE' },

  // botão principal “Postar”
  postBtn: {
    backgroundColor: '#2F80ED',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // botões pequenos (ex.: Remover)
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnDanger: { backgroundColor: '#E53935' },
  smallBtnTextPrimary: { color: '#fff', fontWeight: '800' },
});
