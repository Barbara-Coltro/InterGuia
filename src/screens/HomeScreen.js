import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Header />

      <View style={styles.center}>
        <TouchableOpacity style={[styles.btn, styles.btnBlue]} onPress={() => router.push('/search')} activeOpacity={0.9}>
          <Text style={styles.btnText}>🔎 Buscar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnPink]} onPress={() => router.push('/publish')} activeOpacity={0.9}>
          <Text style={styles.btnText}>＋ Publicar</Text>
        </TouchableOpacity>
      </View>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 16,
  },
  btn: {
    width: '80%',
    maxWidth: 360,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  btnBlue: { backgroundColor: '#2F80ED' },
  btnPink: { backgroundColor: '#FF2D87' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
