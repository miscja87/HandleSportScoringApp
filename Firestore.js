import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
    apiKey: "***",
    authDomain: "handlesport-2k25.firebaseapp.com",
    projectId: "handlesport-2k25",
    storageBucket: "handlesport-2k25.firebasestorage.app",
    messagingSenderId: "199277353127",
    appId: "1:199277353127:web:6fe36096f315eba357e382",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

export { onSnapshot };

// Referee login
export async function loginAsReferee(idEvent, idRing, refereeId, status)
{
    const uid = `referee_${refereeId}`;
    const getCustomToken = httpsCallable(functions, "getCustomToken");
    const result = await getCustomToken({ tokenId : uid, role : "referee", event : `event_${idEvent}`, ring : `ring_${idRing}` });
    const token = result.data.token;
  
    await signInWithCustomToken(auth, token);
    await waitForAuthInitialized(auth);
    await updateRefereeDoc(idEvent, idRing, refereeId, { status : status })
    console.log("✅ Logged referee " + refereeId + " successful as", auth.currentUser.uid);
}

// Update referee document in Firestore
export async function updateRefereeDoc(idEvent, idRing, refereeId, updateData) {
    const refereeDocName = `event_${idEvent}/ring_${idRing}/referee_${refereeId}`;
    const refereeRef = doc(db, "score", refereeDocName);
    const refereeDocSnap = await getDoc(refereeRef);
    if (refereeDocSnap.exists()) {
        console.log("✅ Updating document " + refereeDocName + " with data:", JSON.stringify(updateData));
        await updateDoc(refereeRef, updateData);
    }
}

// Load referee document from Firestore
export async function loadRefereeDoc(idEvent, idRing, refereeId) {
    const refereeDocName = `event_${idEvent}/ring_${idRing}/referee_${refereeId}`;
    const refereeRef = doc(db, "score", refereeDocName);
    const refereeDocSnap = await getDoc(refereeRef);
    if (refereeDocSnap.exists()) {
        return refereeDocSnap.data();
    } else {
        console.log("❌ Document " + refereeDocName + " not found");
    }
}

// Waiting for auth initialization
function waitForAuthInitialized(auth) {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        user => {
          unsubscribe();
          resolve(user);
        },
        error => {
          unsubscribe();
          reject(error);
        }
      );
    });
}

// Get status document name
export function getStatusDocRef(idEvent, idRing) {

    const statusDocName = `event_${idEvent}/ring_${idRing}/status`;
    return doc(db, "score", statusDocName);
}

// Get referee document name
export function getRefereeDocRef(idEvent, idRing, refereeId) {

    const refereeDocName = `event_${idEvent}/ring_${idRing}/referee_${refereeId}`;
    return doc(db, "score", refereeDocName);
}