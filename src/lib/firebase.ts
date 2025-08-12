'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  projectId: 'leadergrid3',
  appId: '1:203876925697:web:ae7d331d075cdf31f81b00',
  storageBucket: 'leadergrid3.firebasestorage.app',
  apiKey: 'AIzaSyBqS4DPA99x_B2bIs2ORkRz4sL5s0f4a-E',
  authDomain: 'leadergrid3.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '203876925697',
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app };
