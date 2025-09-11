import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import colors from '../theme/colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null); // { uri, fileName }

  const phoneMasked = useMemo(() => maskPhone(phone), [phone]);

  const valid =
    name.trim().length >= 3 &&
    isValidEmail(email) &&
    pass.length >= 6 &&
    pass === pass2;

  async function pickImage() {
    // pede permissão
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Autorize o acesso às imagens para escolher uma foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setAvatar({ uri: asset.uri, fileName: asset.fileName || 'foto-perfil.jpg' });
    }
  }

  function onSubmit() {
    if (!valid) {
      Alert.alert('Verifique os campos', 'Preencha os obrigatórios e confirme a senha.');
      return;
    }
    // Aqui você pode integrar com Firebase Auth + Firestore
    Alert.alert('Tudo certo! 🎉', 'Cadastro válido (a integração vem depois).');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cadastro</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Marca */}
          <Text style={styles.brandLine}>
            <Text style={styles.brandIcon}>🌍 </Text>
            <Text style={styles.brand}>Inter Guia</Text>
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <Labeled label="Nome" required>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Digite seu nome"
                placeholderTextColor="#8E8E8E"
                style={styles.input}
                autoCapitalize="words"
              />
            </Labeled>

            <Row>
              <Labeled label="Celular">
                <TextInput
                  value={phoneMasked}
                  onChangeText={(t) => setPhone(unmaskDigits(t))}
                  placeholder="(xx) xxxxx-xxxx"
                  placeholderTextColor="#8E8E8E"
                  keyboardType="phone-pad"
                  style={[styles.input, { flex: 1 }]}
                  maxLength={16}
                />
              </Labeled>
            </Row>

            <Labeled label="E-mail" required>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#8E8E8E"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </Labeled>

            <Row>
              <Labeled label="Senha" required style={{ flex: 1 }}>
                <TextInput
                  value={pass}
                  onChangeText={setPass}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#8E8E8E"
                  secureTextEntry
                  style={[styles.input, { flex: 1 }]}
                />
              </Labeled>

              <Labeled label="Repetir Senha" required style={{ flex: 1 }}>
                <TextInput
                  value={pass2}
                  onChangeText={setPass2}
                  placeholder="Repita sua senha"
                  placeholderTextColor="#8E8E8E"
                  secureTextEntry
                  style={[styles.input, { flex: 1 }]}
                />
              </Labeled>
            </Row>

            <Labeled label="Foto de perfil">
              <View style={styles.fileRow}>
                <TouchableOpacity style={styles.fileBtn} onPress={pickImage}>
                  <Text style={styles.fileBtnText}>Escolher arquivo</Text>
                </TouchableOpacity>
                <Text style={styles.fileName} numberOfLines={1}>
                  {avatar?.fileName || 'Nenhum arquivo escolhido'}
                </Text>
              </View>
              {avatar?.uri ? <Image source={{ uri: avatar.uri }} style={styles.avatarPreview} /> : null}
            </Labeled>

            <Labeled label="Biografia">
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Escreva um breve resumo sobre você"
                placeholderTextColor="#8E8E8E"
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
              />
            </Labeled>

            {/* Botão */}
            <TouchableOpacity
              style={[styles.cta, !valid && { opacity: 0.6 }]}
              onPress={onSubmit}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaText}>Cadastrar</Text>
            </TouchableOpacity>

            {/* Aceite + link */}
            <Text style={styles.terms}>
              Ao clicar em Cadastrar, você aceita a{'\n'}
              <Text style={{ fontWeight: '700' }}>Política de Privacidade</Text>.
            </Text>

            <TouchableOpacity onPress={() => router.push('/privacy')} style={{ alignSelf: 'center', marginTop: 6 }}>
              <Text style={styles.privacyLink}>Privacidade</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ========== componentes auxiliares ========== */
function Row({ children }) {
  return <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
}

function Labeled({ label, required, children, style }) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      <Text style={styles.label}>
        {required && <Text style={{ color: '#E53935' }}>* </Text>}
        {label}
      </Text>
      {children}
    </View>
  );
}

/* ========== helpers ========== */
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function unmaskDigits(s = '') {
  return (s.match(/\d+/g) || []).join('').slice(0, 11);
}

function maskPhone(raw = '') {
  const d = unmaskDigits(raw);
  if (d.length <= 10) {
    // (xx) xxxx-xxxx
    return d
      .replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) =>
        [a && `(${a}`, a && ') ', b, b && '-', c].filter(Boolean).join('')
      );
  }
  // (xx) xxxxx-xxxx
  return d
    .replace(/^(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_, a, b, c) =>
      [a && `(${a}`, a && ') ', b, b && '-', c].filter(Boolean).join('')
    );
}

/* ========== estilos ========== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: {
    padding: 16,
    paddingBottom: 28,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 2,
  },
  close: { fontSize: 28, color: colors.primary, fontWeight: '700' },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  brandLine: {
    textAlign: 'center',
    fontSize: 20,
    marginBottom: 8,
    color: '#222',
    fontWeight: '800',
  },
  brandIcon: { fontSize: 18 },
  brand: {
    color: colors.primary,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#202020',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileBtn: {
    backgroundColor: '#EDEBFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  fileBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  avatarPreview: {
    marginTop: 8,
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: 'flex-start',
  },
  cta: {
    backgroundColor: '#2F80ED',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  terms: {
    marginTop: 10,
    fontSize: 12,
    color: '#4F4F4F',
    textAlign: 'center',
    lineHeight: 16,
  },
  privacyLink: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
