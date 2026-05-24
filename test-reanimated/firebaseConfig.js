import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAchG-zR3xFonQJ41zjukWIhYKXlwEek-E",
  authDomain: "baza-application-4e83f.firebaseapp.com",
  projectId: "baza-application-4e83f",
  storageBucket: "baza-application-4e83f.firebasestorage.app",
  messagingSenderId: "358855325316",
  appId: "1:358855325316:web:c34eac7956ad987b21b4d1"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, auth };