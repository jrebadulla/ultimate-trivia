
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCJwAgYzgyx0k4prY6at5Kb00LP9oJNTDg",
  authDomain: "ultimate-trivia-946bc.firebaseapp.com",
  projectId: "ultimate-trivia-946bc",
  storageBucket: "ultimate-trivia-946bc.appspot.com",
  messagingSenderId: "897482643976",
  appId: "1:897482643976:web:71b917f3a131b5a7de0fbd",
  measurementId: "G-V69LDL3QVP",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export const auth = getAuth(app);

const analytics = getAnalytics(app);

export { db, analytics };
