// src/firebase.js

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAgfNLeEIiefPT5K8zMgIDoHKfxo25Xogw",
  authDomain: "musicplayersync.firebaseapp.com",
  databaseURL: "https://musicplayersync-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "musicplayersync",
  storageBucket: "musicplayersync.firebasestorage.app",
  messagingSenderId: "556586987974",
  appId: "1:556586987974:web:a44c0a760da41dd39882c7",
  measurementId: "G-V20P8GZW9V"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const allowedAdmins = [
  "matejkratochvilbilina@gmail.com", // replace with actual admin emails
];