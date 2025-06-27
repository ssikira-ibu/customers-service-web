import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA0IQs4S8AUcWRF640H93nD1n5nCbhq6Vk",
    authDomain: "ibu-customer-management.firebaseapp.com",
    projectId: "ibu-customer-management",
    storageBucket: "ibu-customer-management.firebasestorage.app",
    messagingSenderId: "1063358396913",
    appId: "1:1063358396913:web:cbfd03aefb0adca87b6c50"
};  

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
