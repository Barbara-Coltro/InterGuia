import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <View style={styles.center}><Text style={styles.text}>Meu Perfil</Text></View>
      <Footer />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, fontWeight: '700' },
});
