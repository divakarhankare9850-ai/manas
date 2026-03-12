import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0LqCpd-u75RfiIPtVUlyT1-cgWE98rLY",
  authDomain: "manas-c8ed8.firebaseapp.com",
  projectId: "manas-c8ed8",
  storageBucket: "manas-c8ed8.firebasestorage.app",
  messagingSenderId: "653022231740",
  appId: "1:653022231740:web:4d31e84aa8398107d724b9"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
