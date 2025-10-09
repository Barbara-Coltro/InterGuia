import { Ionicons } from '@expo/vector-icons';
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
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../theme/colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);

  // visibilidade das senhas
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const phoneMasked = useMemo(() => maskPhone(phone), [phone]);

  // estados de erro em tempo real
  const emailTouched = email.length > 0;
  const emailInvalid = emailTouched && !isValidEmail(email);
  const pass2Touched = pass2.length > 0;
  const passMismatch = pass2Touched && pass2 !== pass;

  // obrigatórios p/ habilitar botão
  const validBasic =
    name.trim().length > 0 &&
    isValidEmail(email) &&
    pass.length > 0 &&
    pass2.length > 0 &&
    pass2 === pass;

  async function pickImage() {
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
    if (!validBasic) {
      Alert.alert('Verifique os campos', 'Preencha Nome, E-mail válido e Senhas idênticas.');
      return;
    }
    Alert.alert(
      'Cadastro concluído',
      'Parabéns! Você se cadastrou. Clique em OK para fazer Login.',
      [{ text: 'OK', onPress: () => router.replace('/login') }],
      { cancelable: false }
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cadastro</Text>
            <View style={{ width: 28 }} />
          </View>

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

            <Labeled label="Celular">
              <TextInput
                value={phoneMasked}
                onChangeText={(t) => setPhone(unmaskDigits(t))}
                placeholder="(xx) xxxxx-xxxx"
                placeholderTextColor="#8E8E8E"
                keyboardType="phone-pad"
                style={styles.input}
                maxLength={16}
              />
            </Labeled>

            <Labeled label="E-mail" required>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#8E8E8E"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, emailInvalid && styles.inputError]}
              />
              {emailInvalid && <Text style={styles.errorText}>Digite um e-mail válido.</Text>}
            </Labeled>

            <View style={styles.row}>
              <Labeled label="Senha" required style={{ flex: 1 }}>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    value={pass}
                    onChangeText={setPass}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#8E8E8E"
                    secureTextEntry={!showPass}
                    style={[styles.input, { paddingRight: 44 }]}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass((v) => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name={showPass ? 'eye-off' : 'eye'} size={22} color="#666" />
                  </TouchableOpacity>
                </View>
              </Labeled>

              <Labeled label="Repetir Senha" required style={{ flex: 1 }}>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    value={pass2}
                    onChangeText={setPass2}
                    placeholder="Repita sua senha"
                    placeholderTextColor="#8E8E8E"
                    secureTextEntry={!showPass2}
                    style={[
                      styles.input,
                      { paddingRight: 44 },
                      passMismatch && styles.inputError,
                    ]}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass2((v) => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name={showPass2 ? 'eye-off' : 'eye'} size={22} color="#666" />
                  </TouchableOpacity>
                </View>
                {passMismatch && <Text style={styles.errorText}>As senhas não conferem.</Text>}
              </Labeled>
            </View>

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

            {/* Botão habilita somente quando validBasic === true */}
            <TouchableOpacity
              style={[styles.cta, !validBasic && styles.ctaDisabled]}
              onPress={onSubmit}
              activeOpacity={0.9}
              disabled={!validBasic}
            >
              <Text style={styles.ctaText}>Cadastrar</Text>
            </TouchableOpacity>

            <Text style={styles.terms}>
              Ao clicar em Cadastrar, você aceita a{' '}
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

/* auxiliares */
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
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function unmaskDigits(s = '') {
  return (s.match(/\d+/g) || []).join('').slice(0, 11);
}
function maskPhone(raw = '') {
  const d = unmaskDigits(raw);
  if (d.length <= 10) {
    return d.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) =>
      [a && `(${a}`, a && ') ', b, b && '-', c].filter(Boolean).join('')
    );
  }
  return d.replace(/^(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_, a, b, c) =>
    [a && `(${a}`, a && ') ', b, b && '-', c].filter(Boolean).join('')
  );
}

/* estilos */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 8,
  },
  close: { fontSize: 28, color: colors.primary, fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.primary, flex: 1, textAlign: 'center' },

  form: { marginTop: 6 },
  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 13, color: '#333', fontWeight: '700', marginBottom: 6 },
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

  // password input com botão olho
  passwordWrapper: { position: 'relative' },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: 12,
  },

  inputError: {
    borderColor: '#E53935',
    backgroundColor: '#FFF6F6',
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    color: '#888',
    fontSize: 12,
    marginTop: 6,
  },

  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileBtn: {
    backgroundColor: '#EDEBFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  fileBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  fileName: { flex: 1, fontSize: 13, color: '#666' },
  avatarPreview: { marginTop: 8, width: 72, height: 72, borderRadius: 36, alignSelf: 'flex-start' },

  cta: {
    backgroundColor: '#2F80ED',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaDisabled: { opacity: 0.55 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  terms: { marginTop: 10, fontSize: 12, color: '#4F4F4F', textAlign: 'center', lineHeight: 16 },
  privacyLink: { color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
});
