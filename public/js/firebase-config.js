// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBza-91jxovwK7LTye6KhuvbgWli1OqUwQ",
  authDomain: "hantverksporten-8e490.firebaseapp.com",
  projectId: "hantverksporten-8e490",
  storageBucket: "hantverksporten-8e490.firebasestorage.app",
  messagingSenderId: "426251114937",
  appId: "1:426251114937:web:2f22b486ed27410766fe68",
  measurementId: "G-969MZFTT01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };