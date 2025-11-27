import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA2cBWojdQ0XZmva-Gd37MG7kUgAE-G8dU",
  authDomain: "localexplorer-96c91.firebaseapp.com",
  projectId: "localexplorer-96c91",
  storageBucket: "localexplorer-96c91.appspot.com",

  messagingSenderId: "199001314111",
  appId: "1:199001314111:web:f3388500e51c930cb4798a",
  measurementId: "G-00QVE5HSR2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDB = getDatabase(app);
