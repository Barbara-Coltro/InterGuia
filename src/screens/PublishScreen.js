import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Footer from '../components/Footer';
import Header from '../components/Header';
import colors from '../theme/colors';

export default function PublishScreen() {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  // 🔄 CIDADE
  const [cityQuery, setCityQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingCity, setLoadingCity] = useState(false);
  const [cityError, setCityError] = useState('');
  const [loc, setLoc] = useState({ city: '', state: '', country: '' });

  // 📷 FOTO
  const [photo, setPhoto] = useState(null);

  // debounce simples
  useEffect(() => {
    setCityError('');
    setLoc({ city: '', state: '', country: '' });
    setSuggestions([]);

    const q = cityQuery.trim();
    if (q.length < 3) return;

    const t = setTimeout(() => {
      lookupCity(q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityQuery]);

  async function lookupCity(query) {
    const key =
      Constants.expoConfig?.extra?.googleMapsApiKey ||
      Constants.manifest?.extra?.googleMapsApiKey;
    if (!key) {
      setCityError('Chave do Google não configurada.');
      return;
    }
    try {
      setLoadingCity(true);
      // Geocoding por texto da cidade (sem travar no Brasil; idioma PT-BR)
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&language=pt-BR&key=${key}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.status !== 'OK' || !json.results?.length) {
        setCityError('Cidade não encontrada.');
        return;
      }

      // Extrai apenas resultados que parecem cidade/município
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
        // ignora itens sem país
        if (!country) return null;
        return { city, state, country, formatted };
      };

      const list = json.results
        .map(parse)
        .filter(Boolean)
        // remove duplicados por formatted
        .reduce((acc, cur) => {
          if (!acc.find((x) => x.formatted === cur.formatted)) acc.push(cur);
          return acc;
        }, [])
        .slice(0, 5);

      setSuggestions(list);
    } catch (e) {
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Autorize o acesso às imagens.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.length) {
      setPhoto({ uri: result.assets[0].uri });
    }
  }

  function onSelectSuggestion(item) {
    setLoc({ city: item.city, state: item.state, country: item.country });
    setCityQuery(item.formatted);
    setSuggestions([]);
  }

  function onPost() {
    if (!desc.trim()) {
      Alert.alert('Informe a descrição', 'Conte um pouco da sua experiência.');
      return;
    }
    if (!loc.city) {
      Alert.alert('Informe a cidade', 'Escolha uma cidade nas sugestões.');
      return;
    }
    Alert.alert('Publicado!', 'Seu post foi criado com sucesso.', [
      { text: 'OK', onPress: () => router.replace('/home') },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header />

      {/* barra de ação */}
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.back}>{'X'} Criar post</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postBtn} onPress={onPost} activeOpacity={0.9}>
          <Text style={styles.postBtnText}>Postar</Text>
        </TouchableOpacity>
      </View>

      {/* conteúdo */}
      <View style={styles.container}>
        {/* Nome */}
        <Text style={styles.label}>Nome da pessoa</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome da pessoa"
         
          style={[styles.input, styles.inputName]}
        />

        {/* Descrição */}
        <Text style={[styles.label, { marginTop: 6 }]}>Descreva sua experiência…</Text>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="Descreva sua experiência…"
          placeholderTextColor="#777"
          multiline
          style={[styles.input, styles.textarea]}
        />

        {/* Cidade + sugestões */}
        <Text style={[styles.label, { marginTop: 10 }]}>Adicione a Cidade</Text>
        <TextInput
          value={cityQuery}
          onChangeText={setCityQuery}
          placeholder="Ex.: São Paulo, Madrid, Paris…"
          placeholderTextColor="#777"
          style={styles.input}
        />

        {loadingCity ? (
          <View style={styles.row}>
            <ActivityIndicator />
            <Text style={styles.info}>Buscando cidades…</Text>
          </View>
        ) : cityError ? (
          <Text style={[styles.info, { color: '#E53935' }]}>{cityError}</Text>
        ) : suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.formatted}
            style={styles.suggestList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestItem} onPress={() => onSelectSuggestion(item)}>
                <Text style={styles.suggestText}>{item.formatted}</Text>
              </TouchableOpacity>
            )}
          />
        ) : null}

        {/* Local selecionado */}
        {loc.city ? (
          <Text style={[styles.info, { fontWeight: '700' }]}>
            {loc.city} — {loc.state} — {loc.country}
          </Text>
        ) : null}

        {/* Foto */}
        <TouchableOpacity style={[styles.bigBtn, { marginTop: 16 }]} onPress={pickImage} activeOpacity={0.9}>
          <Text style={styles.bigBtnText}>Adicione foto</Text>
        </TouchableOpacity>

        {photo?.uri ? <Image source={{ uri: photo.uri }} style={styles.preview} /> : null}
      </View>

      <Footer />
    </SafeAreaView>
  );
}

/* estilos */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },

  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: { color: '#333', fontWeight: '700' },
  postBtn: {
    backgroundColor: '#2F80ED',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  postBtnText: { color: '#fff', fontWeight: '800' },

  container: { flex: 1, paddingHorizontal: 16, paddingBottom: 20 },

  label: { color: '#B23C9A', fontWeight: '800', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  inputName: {},
  textarea: { height: 130, textAlignVertical: 'top' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  info: { marginTop: 6, color: '#333' },

  suggestList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    maxHeight: 180,
  },
  suggestItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  suggestText: { color: '#333' },

  bigBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  bigBtnText: { color: '#fff', fontWeight: '800' },

  preview: { marginTop: 10, width: '100%', height: 160, borderRadius: 10 },
});
