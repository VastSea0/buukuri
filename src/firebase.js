import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {

    apiKey: "AIzaSyAgjb9v0LS5AtjIKr_6ejWkvPVdvubIHXY",
  
    authDomain: "opensodaproject.firebaseapp.com",
  
    projectId: "opensodaproject",
  
    storageBucket: "opensodaproject.appspot.com",
  
    messagingSenderId: "364099706420",
  
    appId: "1:364099706420:web:6d39db2bff04a3af6ff461",
  
    measurementId: "G-E7ZWYC9NJV"
  
  };
  

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
