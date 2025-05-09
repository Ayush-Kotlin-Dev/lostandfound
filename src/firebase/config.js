// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";
import {getAnalytics} from "firebase/analytics";
import {getDatabase} from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBUcw-STGgmPrC-6kXEifWEBWxVyJZsJ5U",
    authDomain: "theshoppper-4b4f0.firebaseapp.com",
    databaseURL: "https://theshoppper-4b4f0-default-rtdb.firebaseio.com",
    projectId: "theshoppper-4b4f0",
    storageBucket: "theshoppper-4b4f0.appspot.com",
    messagingSenderId: "1066416284635",
    appId: "1:1066416284635:web:3631bae2e71a8f738dfdfe",
    measurementId: "G-QMPY5ZV97L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

export default app;