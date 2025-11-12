import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Footer from '../components/Footer';
import Header from '../components/Header';
import colors from '../theme/colors';

import { updateProfile } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';

/* helpers */
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
function fmtDate(ts) {
  try {
    const ms =
      typeof ts?.toMillis === 'function' ? ts.toMillis() :
      typeof ts === 'number' ? ts : Date.now();
    const d = new Date(ms);
    const dd = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    return dd;
  } catch { return ''; }
}

export default function ProfileScreen() {
  const user = auth.currentUser;

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [photoURL, setPhotoURL] = useState(user?.photoURL || null);
  const [name, setName] = useState(user?.displayName || 'Meu Perfil');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [storagePath, setStoragePath] = useState(null);

  const [posts, setPosts] = useState([]);

  // modal edição
  const [editOpen, setEditOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formAvatar, setFormAvatar] = useState(null); // { uri, fileName, mimeType }
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  /* perfil em tempo real */
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setBio(data?.bio || '');
          setPhone(data?.phone || '');
          setPhotoURL(data?.photoURL || user.photoURL || null);
          setName(data?.name || user.displayName || 'Meu Perfil');
          setStoragePath(data?.storagePath || null);
        }
        setLoadingProfile(false);
      },
      () => setLoadingProfile(false)
    );
    return unsub;
  }, [user]);

  /* posts do usuário — usa userId (como está no seu banco) */
  useEffect(() => {
    if (!user) return;
    const qUserPosts = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      qUserPosts,
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setPosts(list);
        setLoadingPosts(false);
      },
      (err) => {
        console.log('[ProfileScreen] erro ao carregar posts:', err);
        setLoadingPosts(false);
      }
    );

    return unsub;
  }, [user]);

  const hasPosts = useMemo(() => posts.length > 0, [posts]);

  /* abrir modal com valores atuais */
  function openEdit() {
    setFormName(name || '');
    setFormPhone(phone || '');
    setFormBio(bio || '');
    setFormAvatar(null);
    setRemovePhoto(false);
    setEditOpen(true);
  }

  /* escolher nova foto */
  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Autorize o acesso às imagens.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.length) {
      const a = result.assets[0];
      setFormAvatar({
        uri: a.uri,
        fileName: a.fileName || 'avatar.jpg',
        mimeType: a.mimeType || 'image/jpeg',
      });
      setRemovePhoto(false);
    }
  }

  /* remover foto (marca pra remover ao salvar) */
  function handleRemovePhoto() {
    setFormAvatar(null);
    setRemovePhoto(true);
  }

  /* salvar perfil (Auth + Firestore + Storage) */
  async function saveProfile() {
    if (!user) return;

    const newName = (formName || '').trim();
    const newPhone = unmaskDigits(formPhone);
    const newBio = (formBio || '').trim();

    if (!newName) {
      Alert.alert('Nome obrigatório', 'Preencha o nome.');
      return;
    }

    try {
      setSaving(true);
      let newPhotoURL = photoURL;
      let newStoragePath = storagePath || null;

      if (removePhoto) {
        if (newStoragePath) {
          try {
            await deleteObject(ref(storage, newStoragePath));
          } catch (e) {
            console.log('deleteObject warning:', e?.code || e?.message || e);
          }
        }
        newPhotoURL = null;
        newStoragePath = null;
      } else if (formAvatar?.uri) {
        const extFromMime = (formAvatar.mimeType?.split('/')[1] || '').split(';')[0] || '';
        const extFromName = (formAvatar.fileName?.split('.').pop() || '').toLowerCase();
        const ext = (extFromMime || extFromName || 'jpg').replace(/[^a-z0-9]/g, '');
        newStoragePath = `avatars/${user.uid}.${ext}`;

        const avatarRef = ref(storage, newStoragePath);
        const resp = await fetch(formAvatar.uri);
        const blob = await resp.blob();
        await uploadBytes(avatarRef, blob, { contentType: formAvatar.mimeType || 'image/jpeg' });
        newPhotoURL = await getDownloadURL(avatarRef);
      }

      // Auth
      await updateProfile(user, {
        displayName: newName,
        photoURL: newPhotoURL || undefined,
      });

      // Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        name: newName,
        phone: newPhone,
        bio: newBio,
        photoURL: newPhotoURL || null,
        storagePath: newStoragePath || null,
      });

      try { await auth.currentUser.reload(); } catch {}
      const u = auth.currentUser;
      setPhotoURL(removePhoto ? null : (u?.photoURL || newPhotoURL || null));
      setName(u?.displayName || newName);

      setEditOpen(false);
      Alert.alert('Pronto', 'Perfil atualizado com sucesso.');
    } catch (e) {
      console.log('UPDATE PROFILE ERROR', e);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header />

      {/* wrapper p/ Footer fixo */}
      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* CARD PERFIL */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{name || 'Meu Perfil'}</Text>
              <TouchableOpacity onPress={openEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="pencil" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            {loadingProfile ? (
              <ActivityIndicator style={{ marginVertical: 12 }} />
            ) : (
              <>
                <View style={styles.avatarRow}>
                  {photoURL ? (
                    <Image
                      key={photoURL || 'no-photo'}
                      source={{ uri: photoURL }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={36} color="#bbb" />
                    </View>
                  )}
                </View>

                <Text style={styles.sectionLabel}>Biografia</Text>
                {bio ? (
                  <Text style={styles.bioText}>{bio}</Text>
                ) : (
                  <Text style={styles.bioMuted}>Você ainda não adicionou uma biografia.</Text>
                )}
              </>
            )}
          </View>

          {/* CARD PUBLICAÇÕES (pai) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Publicações</Text>
              {!hasPosts && (
                <TouchableOpacity onPress={() => router.push('/publish')}>
                  <Ionicons name="add-circle" size={22} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {loadingPosts ? (
              <ActivityIndicator style={{ marginVertical: 12 }} />
            ) : hasPosts ? (
              <View style={{ gap: 12 }}>
                {posts.map((item) => (
                  <PostCard key={item.id} item={item} />
                ))}
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Você ainda não publicou nada.</Text>
                <TouchableOpacity
                  style={styles.publishBtn}
                  onPress={() => router.push('/publish')}
                  activeOpacity={0.9}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.publishText}>Publicar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <Footer />
      </View>

      {/* MODAL EDIÇÃO */}
      <Modal visible={editOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <TouchableOpacity onPress={() => setEditOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Mini preview + Trocar/Remover */}
            <View style={styles.photoRow}>
              {formAvatar?.uri ? (
                <Image source={{ uri: formAvatar.uri }} style={styles.thumb} />
              ) : photoURL && !removePhoto ? (
                <Image source={{ uri: photoURL }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={24} color="#bbb" />
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
                <TouchableOpacity style={[styles.smallBtn2, styles.btnGhost]} onPress={pickImage}>
                  <Ionicons name="image" size={16} color={colors.primary} />
                  <Text style={styles.smallGhostText}>Trocar foto</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.smallBtn2, styles.btnDanger]} onPress={handleRemovePhoto}>
                  <Ionicons name="trash" size={16} color="#fff" />
                  <Text style={styles.smallBtnTextPrimary}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="Seu nome"
                placeholderTextColor="#8E8E8E"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Celular</Text>
              <TextInput
                value={maskPhone(formPhone)}
                onChangeText={(t) => setFormPhone(unmaskDigits(t))}
                placeholder="(xx) xxxxx-xxxx"
                placeholderTextColor="#8E8E8E"
                keyboardType="phone-pad"
                style={styles.input}
                maxLength={16}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Biografia</Text>
              <TextInput
                value={formBio}
                onChangeText={setFormBio}
                placeholder="Conte um pouco sobre você…"
                placeholderTextColor="#8E8E8E"
                multiline
                style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={saveProfile}
              disabled={saving}
              activeOpacity={0.9}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Salvar alterações</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** ------- Card interno de publicação ------- */
function PostCard({ item }) {
  const img = item.photoUrl || item.imageURL || null;
  const when = fmtDate(item.createdAt);
  const loc = [item.city, item.state, item.country].filter(Boolean).join(' — ');

  return (
    <View style={styles.postCard}>
      {/* Cabeçalho do post */}
      <View style={styles.postHead}>
        {loc ? <Text style={styles.postLoc}>{loc}</Text> : <Text style={styles.postLocMuted}>Sem localização</Text>}
        {when ? <Text style={styles.postDate}>{when}</Text> : null}
      </View>

      {/* Imagem (se houver) */}
      {img ? (
        <Image source={{ uri: img }} style={styles.postImage} />
      ) : (
        <View style={[styles.postImage, styles.postImagePlaceholder]}>
          <Ionicons name="image" size={22} color="#aaa" />
          <Text style={styles.postImageMuted}>Sem foto</Text>
        </View>
      )}

      {/* Conteúdo */}
      {item.description ? (
        <View style={styles.postField}>
          <Text style={styles.fieldLabel}>Experiência</Text>
          <Text style={styles.fieldText}>{item.description}</Text>
        </View>
      ) : null}

      {item.experience ? (
        <View style={styles.postField}>
          <Text style={styles.fieldLabel}>Experiência</Text>
          <Text style={styles.fieldText}>{item.experience}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* estilos */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  body: { flex: 1 },
  scroll: { paddingBottom: 96 },

  /* Card genérico (perfil e container de publicações) */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '800', color: colors.primary },

  /* Perfil */
  avatarRow: { alignItems: 'center', marginVertical: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#eee' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },

  sectionLabel: { marginTop: 8, fontWeight: '800', color: '#333', textAlign: 'center' },
  bioText: { marginTop: 6, color: '#333', lineHeight: 20, textAlign: 'center' },
  bioMuted: { marginTop: 6, color: '#888', textAlign: 'center' },

  /* Estado vazio */
  empty: { alignItems: 'center', paddingVertical: 12 },
  emptyText: { color: '#666', marginBottom: 10 },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  publishText: { color: '#fff', fontWeight: '800' },

  /* ---- Cards internos de postagem ---- */
  postCard: {
    backgroundColor: '#FBFBFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECECFA',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  postHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  postLoc: { fontSize: 12, fontWeight: '700', color: colors.primary },
  postLocMuted: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  postDate: { fontSize: 12, color: '#777' },

  postImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    backgroundColor: '#EEE',
    marginBottom: 10,
  },
  postImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  postImageMuted: { fontSize: 12, color: '#aaa', marginTop: 4 },

  postField: { marginTop: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#333', marginBottom: 2 },
  fieldText: { fontSize: 14, color: '#222', lineHeight: 20 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111' },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  thumb: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEE' },

  inputGroup: { marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 6 },
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

  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  
    smallBtn2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
 btnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.primary },
  smallGhostText: { color: colors.primary, fontWeight: '800' },
   btnDanger: { backgroundColor: '#E53935' },
  smallBtnTextPrimary: { color: '#fff', fontWeight: '800' },
});
