// Configuração do Firebase
const firebaseConfig = {
  // Estas são configurações de exemplo. O usuário precisará substituir com suas próprias credenciais do Firebase
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
