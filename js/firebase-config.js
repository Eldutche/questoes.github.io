// Configuração do Firebase
const firebaseConfig = {
  // Estas são configurações de exemplo. O usuário precisará substituir com suas próprias credenciais do Firebase
  apiKey: "AIzaSyBa8bgpGBPPJWxZk0KkhzSgf3OEPeJiCeQ",
  authDomain: "questoes-site-71196.firebaseapp.com",
  projectId: "questoes-site-71196",
  storageBucket: "questoes-site-71196.firebasestorage.app",
  messagingSenderId: "898747884068",
  appId: "1:898747884068:web:015d4c08a41610b6e72eb1"
  
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências para serviços do Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configurações do Firestore
db.settings({
  timestampsInSnapshots: true
});

// Exportar para uso em outros arquivos
const firebaseServices = {
  auth,
  db,
  storage,
  firebase
};
