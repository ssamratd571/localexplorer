import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const ADMIN_CODE = "SamratHEFA"; // your secret admin code

export async function registerWithEmail({ displayName, email, password, adminCode }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  // set display name in Firebase Auth
  await updateProfile(user, { displayName });

  // user role decide
  const role = adminCode === ADMIN_CODE ? "admin" : "user";

  // save to Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName,
    email,
    role,
    createdAt: Date.now(),
  });

  return { ok: true };
}

export async function loginWithEmail(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}
