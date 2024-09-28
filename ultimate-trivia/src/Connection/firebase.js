import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCI4VFOAOcbtMUHeEDPydLEyUgfzN3NsUE",
  authDomain: "ultimate-trivia-f7884.firebaseapp.com",
  projectId: "ultimate-trivia-f7884",
  storageBucket: "ultimate-trivia-f7884.appspot.com",
  messagingSenderId: "607715781953",
  appId: "1:607715781953:web:47c1342ab5617f46b7c5c0",
};

const app = firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

export { db, auth };
