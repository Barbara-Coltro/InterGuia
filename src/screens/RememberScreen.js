import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../theme/colors';

export default function RememberScreen() {
  const [email, setEmail] = useState('');

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function onSend() {
    if (!isValidEmail(email)) {
      Alert.alert('E-mail inválido', 'Digite um e-mail válido para continuar.');
      return;
    }
    Alert.alert('Pronto!', 'Se existir uma conta, enviaremos instruções para este e-mail.', [
      { text: 'OK', onPress: () => router.replace('/login') },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER PADRÃO */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.close}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recuperar acesso</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* CONTEÚDO CENTRAL */}
      <View style={styles.center}>
        <View style={styles.box}>
          <Text style={styles.label}>E-mail cadastrado</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor="#8E8E8E"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TouchableOpacity style={styles.cta} onPress={onSend} activeOpacity={0.9}>
            <Text style={styles.ctaText}>Enviar instruções</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/login')}
            style={{ alignSelf: 'center', marginTop: 12 }}
          >
            <Text style={styles.linkMuted}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 8,
  },
  closeBtn: {
    marginLeft: 8, // 👈 mesmo recuo lateral do login/cadastro
  },
  close: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    flex: 1,
    textAlign: 'center',
  },

  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
  box: { width: '100%', maxWidth: 420, alignSelf: 'center' },

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

  cta: {
    backgroundColor: '#2F80ED',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  linkMuted: { color: '#888', fontWeight: '700' },
});
