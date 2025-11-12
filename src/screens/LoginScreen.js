import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { observeAuth, signInEmailPassword } from '../services/auth';
import colors from '../theme/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailTouched = email.length > 0;
  const emailInvalid = emailTouched && !isValidEmail(email);
  const validToEnter = isValidEmail(email) && pass.length > 0;

  useEffect(() => {
    // se já estiver logada, manda pra Home automaticamente
    const unsub = observeAuth((user) => {
      if (user) router.replace('/home');
    });
    return unsub;
  }, []);

  async function onEnter() {
    if (!validToEnter || loading) return;
    try {
      setLoading(true);
      await signInEmailPassword(email.trim(), pass);
      // onAuthStateChanged redireciona; mas podemos garantir também:
      router.replace('/home');
    } catch (err) {
      const msg = mapFirebaseAuthError(err);
      Alert.alert('Não foi possível entrar', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER PADRÃO */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Entrar</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* CONTEÚDO CENTRAL */}
          <View style={styles.centerWrapper}>
            <View style={styles.form}>
              <Labeled label="Login">
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

              <Labeled label="Senha">
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

              <TouchableOpacity
                style={[styles.cta, (!validToEnter || loading) && styles.ctaDisabled]}
                onPress={onEnter}
                activeOpacity={0.9}
                disabled={!validToEnter || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Entrar</Text>
                )}
              </TouchableOpacity>

              {/* Google (só visual por enquanto) */}
              <TouchableOpacity style={styles.googleBtn} activeOpacity={0.9}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                  <Text style={styles.googleText}>Entrar com Google</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/remember')} style={{ alignSelf: 'center', marginTop: 14 }}>
                <Text style={styles.linkMuted}>Esqueceu o login?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* componente auxiliar */
function Labeled({ label, children }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function mapFirebaseAuthError(err) {
  const code = err?.code || '';
  if (code === 'auth/invalid-email') return 'E-mail inválido.';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'Credenciais inválidas.';
  if (code === 'auth/user-disabled') return 'Usuário desabilitado.';
  if (code === 'auth/user-not-found') return 'Usuário não encontrado.';
  if (code === 'auth/too-many-requests') return 'Muitas tentativas. Tente novamente mais tarde.';
  if (code === 'auth/network-request-failed') return 'Sem conexão. Verifique sua internet.';
  return 'Ocorreu um erro inesperado.';
}

/* estilos (mantive seu padrão) */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 8,
  },
  closeBtn: { marginLeft: 8 },
  close: { fontSize: 28, color: colors.primary, fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.primary, flex: 1, textAlign: 'center' },

  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  form: { width: '100%', maxWidth: 420, alignSelf: 'center' },

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
  inputError: { borderColor: '#E53935', backgroundColor: '#FFF6F6' },
  errorText: { color: '#E53935', fontSize: 12, marginTop: 4 },

  passwordWrapper: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 10, top: 12 },

  cta: {
    backgroundColor: '#2F80ED',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  ctaDisabled: { opacity: 0.55 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  googleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  googleText: { fontSize: 14, fontWeight: '600', color: '#333' },
  linkMuted: { color: '#888', fontWeight: '700' },
});
