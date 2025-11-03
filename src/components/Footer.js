import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

export default function Footer() {
  const path = usePathname();

  const Item = ({ icon, to }) => {
    const active = path === to;
    return (
      <TouchableOpacity onPress={() => router.replace(to)} style={styles.item} activeOpacity={0.8}>
        <Ionicons
          name={icon}
          size={32}               // 👈 aumentei o tamanho
          color={active ? colors.primary : '#333'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.bar}>
        <Item icon="home" to="/home" />
        <Item icon="search" to="/search" />
        <Item icon="add-circle-outline" to="/publish" />
        <Item icon="person-circle-outline" to="/profile" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#fff' }, // respeita o “queixo” do iPhone/gestures
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,            // mais altura
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  item: { padding: 8 },
});
