
'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "leadergrid3",
  "appId": "1:203876925697:web:ae7d331d075cdf31f81b00",
  "storageBucket": "leadergrid3.firebasestorage.app",
  "apiKey": "AIzaSyC-lpIVUm3ZEmysGOD_2D6J1ZkAB-sdbn4",
  "authDomain": "leadergrid3.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "203876925697"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
