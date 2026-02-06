// firebase.ts
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Configuração do Firebase para o projeto Montanha Gestão.
const firebaseConfig = {
  apiKey: "AIzaSyAzgVDZm7Yke0J7x8k8AqWV3BNfByGJ_1E",
  authDomain: "montanhagestao.firebaseapp.com",
  projectId: "montanhagestao",
  storageBucket: "montanhagestao.appspot.com",
  messagingSenderId: "187113862407",
  appId: "1:187113862407:web:36df4dde16d5316396c1a2",
  measurementId: "G-HB03J0C56W"
};

// Inicializa o Firebase e exporta os serviços
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Converte um documento do Firestore, incluindo seu ID e transformando Timestamps em Dates.
 * @param doc O documento do Firestore.
 * @returns Um objeto com o ID e os dados do documento com Datas JS.
 */
export function processFirestoreDoc(doc: any) {
  const data = doc.data();
  // Converte todos os campos Timestamp para objetos Date
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate();
    }
  }
  return { id: doc.id, ...data };
}

export { app, auth, db };