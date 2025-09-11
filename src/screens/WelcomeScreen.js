import { router } from 'expo-router';
import { ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import colors from '../theme/colors';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../../assets/imagens/imagem_interguia.jpg')}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* overlay atrás de tudo */}
        <View style={styles.overlay} />

        {/* page organiza verticalmente: meio (título) e base (botões) */}
        <View style={styles.page}>
          {/* --- CENTRO --- */}
          <View style={styles.center}>
            <Text style={styles.title}>Inter Guia</Text>
          </View>

          {/* --- BASE/BOTÕES --- */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/register')}>
              <Text style={styles.primaryTxt}>Criar conta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/login')}>
              <Text style={styles.outlineTxt}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/privacy')} style={styles.privacy}>
              <Text style={styles.privacyTxt}>Privacidade</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const BTN_RADIUS = 12;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    zIndex: 0,
  },
  page: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    zIndex: 1,                    // fica acima do overlay
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',     // centraliza VERTICAL e HORIZONTAL
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  buttons: { width: '100%', gap: 12 },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: BTN_RADIUS,
    alignItems: 'center',
  },
  primaryTxt: { color: colors.white, fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    paddingVertical: 14,
    borderRadius: BTN_RADIUS,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  outlineTxt: { color: colors.white, fontSize: 16, fontWeight: '700' },
  privacy: { alignSelf: 'center', marginTop: 6 },
  privacyTxt: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
});
