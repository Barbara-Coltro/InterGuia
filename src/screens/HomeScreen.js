import { router } from 'expo-router';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../theme/colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>Bem-vinda ao Inter Guia 🎉</Text>

        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/login')}>
          <Text style={styles.btnText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.primary, marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#333', marginBottom: 16 },
  btn: {
    backgroundColor: '#2F80ED', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 10, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
