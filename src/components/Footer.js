import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function Footer() {
  const path = usePathname();
  const [userPhoto, setUserPhoto] = useState(null);

  // Escuta Auth + users/{uid} para refletir mudanças de foto sem relogar
  useEffect(() => {
    let unsubUserDoc = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try { await user.reload(); } catch {}
        setUserPhoto(user.photoURL || null);

        unsubUserDoc?.();
        unsubUserDoc = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          const d = snap.data();
          setUserPhoto(d?.photoURL || user.photoURL || null);
        });
      } else {
        setUserPhoto(null);
        unsubUserDoc?.();
        unsubUserDoc = null;
      }
    });

    return () => {
      unsubAuth();
      unsubUserDoc?.();
    };
  }, []);

  const Item = ({ icon, to, isProfile }) => {
    const active = path === to;
    const color = active ? colors.primary : '#333';

    return (
      <TouchableOpacity onPress={() => router.replace(to)} style={styles.item} activeOpacity={0.8}>
        {isProfile ? (
          userPhoto ? (
            <Image
              key={userPhoto || 'no-photo'} // força remount ao trocar/remover
              source={{ uri: userPhoto }}
              style={[styles.avatar, { borderColor: active ? colors.primary : '#ccc' }]}
            />
          ) : (
            <Ionicons name={icon} size={32} color={color} />
          )
        ) : (
          <Ionicons name={icon} size={32} color={color} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.bar}>
        <Item icon="home" to="/home" />
        <Item icon="search" to="/search" />
        <Item icon="add-circle-outline" to="/publish" />
        <Item icon="person-circle-outline" to="/profile" isProfile />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#fff' },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  item: { padding: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
});
