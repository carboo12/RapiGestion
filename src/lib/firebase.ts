import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  "projectId": "rapigestion",
  "appId": "1:264912657109:web:7afc65a295be35aa1be05c",
  "storageBucket": "rapigestion.firebasestorage.app",
  "apiKey": "AIzaSyARLOC7orrf-VIvVDXThB84uI6FHKVLnkc",
  "authDomain": "rapigestion.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "264912657109"
};

export const app = initializeApp(firebaseConfig);
