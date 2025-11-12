// src/services/auth.js
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';

/**
 * Login com e-mail/senha
 */
export async function signInEmailPassword(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * Observer de sessão (login/logout)
 */
export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Cadastro com foto opcional
 * data: { name, email, password, phone?, bio?, avatarUri?, avatarMime?, avatarName? }
 */
export async function signUpEmailPassword(data) {
  const {
    name,
    email,
    password,
    phone = '',
    bio = '',
    avatarUri,
    avatarMime = 'image/jpeg',
    avatarName = 'avatar.jpg',
  } = data;

  // 1) Cria usuário no Auth
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  // 2) Upload opcional do avatar para Storage
  let photoURL = '';
  let storagePath = '';
  if (avatarUri) {
    try {
      // tenta deduzir extensão
      const extFromMime = (avatarMime.split('/')[1] || '').split(';')[0] || '';
      const extFromName = (avatarName.split('.').pop() || '').toLowerCase();
      const ext = (extFromMime || extFromName || 'jpg').replace(/[^a-z0-9]/g, '');

      storagePath = `avatars/${user.uid}.${ext}`;
      const avatarRef = ref(storage, storagePath);

      // RN/Expo: transformar file:// em Blob real e enviar
      const resp = await fetch(avatarUri);
      const blob = await resp.blob();

      await uploadBytes(avatarRef, blob, { contentType: avatarMime || 'image/jpeg' });
      photoURL = await getDownloadURL(avatarRef);

      console.log('[signup] upload OK:', storagePath);
      console.log('[signup] photoURL:', photoURL);
    } catch (e) {
      console.warn('⚠️ Upload falhou, seguindo sem foto:', e);
    }
  }

  // 3) Atualiza perfil do Auth (nome + foto)
  await updateProfile(user, {
    displayName: name,
    photoURL: photoURL || undefined,
  });

  // 4) Grava documento no Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    name,
    email: user.email,
    phone,
    bio,
    photoURL: photoURL || null,     // URL pública
    storagePath: storagePath || null, // caminho no bucket
    createdAt: serverTimestamp(),
  });

  return user;
}

/**
 * Mensagens amigáveis para erros comuns
 */
export function mapSignupErr(err) {
  const code = err?.code || '';
  if (code === 'auth/email-already-in-use') return 'Este e-mail já está cadastrado.';
  if (code === 'auth/invalid-email') return 'E-mail inválido.';
  if (code === 'auth/weak-password') return 'A senha é muito fraca (mínimo 6).';
  if (code === 'auth/network-request-failed') return 'Sem conexão. Verifique sua internet.';
  return 'Ocorreu um erro inesperado.';
}
