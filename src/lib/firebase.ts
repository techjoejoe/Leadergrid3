
'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "leadergrid3",
  "appId": "1:203876925697:web:ae7d331d075cdf31f81b00",
  "storageBucket": "leadergrid3.appspot.com",
  "apiKey": "AIzaSyC-lpIVUm3ZEmysGOD_2D6J1ZkAB-sdbn4",
  "authDomain": "leadergrid3.firebaseapp.com",
  "measurementId": "G-S33W4V3GZ3",
  "messagingSenderId": "203876925697"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Set persistence to local to keep users logged in
setPersistence(auth, browserLocalPersistence);


export { app, db, auth };
