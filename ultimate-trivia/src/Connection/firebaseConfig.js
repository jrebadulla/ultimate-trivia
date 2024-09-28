import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCI4VFOAOcbtMUHeEDPydLEyUgfzN3NsUE",
    authDomain: "ultimate-trivia-f7884.firebaseapp.com",
    projectId: "ultimate-trivia-f7884",
    storageBucket: "ultimate-trivia-f7884.appspot.com",
    messagingSenderId: "607715781953",
    appId: "1:607715781953:web:47c1342ab5617f46b7c5c0",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export { auth, db, storage };
