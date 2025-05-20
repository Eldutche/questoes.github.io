# Sistema de Questões - Firebase + GitHub Pages

Este é um sistema completo de questões desenvolvido para ser hospedado no GitHub Pages com backend Firebase, permitindo armazenamento permanente e acesso em múltiplos dispositivos.

## Funcionalidades

- **Autenticação de usuários** com email/senha e Google
- **Cadastro, edição e exclusão de questões**
- **Upload de imagens** para as questões
- **Sistema de responder questões** interativamente
- **Impressão de questões** por matéria e assunto
- **Interface responsiva** para qualquer dispositivo

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Hospedagem**: GitHub Pages

## Estrutura do Projeto

```
questoes-app/
├── css/
│   └── styles.css
├── js/
│   ├── firebase-config.js  # Configuração do Firebase (requer suas credenciais)
│   ├── auth.js             # Gerenciamento de autenticação
│   ├── app.js              # Funcionalidades principais
│   ├── questoes.js         # Gerenciamento de questões
│   ├── responder.js        # Sistema de responder questões
│   └── imprimir.js         # Geração de PDFs
├── img/                    # Diretório para imagens estáticas
├── pages/
│   ├── questoes.html       # Página de gerenciamento de questões
│   ├── responder.html      # Página para responder questões
│   └── imprimir.html       # Página para impressão de questões
└── index.html              # Página inicial
```

## Configuração do Firebase

Antes de usar o sistema, você precisa configurar seu próprio projeto Firebase:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Adicione um aplicativo web ao seu projeto
4. Copie as credenciais fornecidas
5. Substitua as credenciais no arquivo `js/firebase-config.js`

```javascript
// Substitua este objeto com suas próprias credenciais do Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

## Configuração do Firebase Authentication

1. No console do Firebase, vá para "Authentication"
2. Ative os provedores de autenticação:
   - Email/Senha
   - Google

## Configuração do Firestore Database

1. No console do Firebase, vá para "Firestore Database"
2. Crie um banco de dados
3. Inicie no modo de teste ou configure as seguintes regras de segurança:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso apenas a usuários autenticados
    match /questoes/{questaoId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.usuarioId;
    }
    match /resultados/{resultadoId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.usuarioId;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.usuarioId;
    }
  }
}
```

## Configuração do Firebase Storage

1. No console do Firebase, vá para "Storage"
2. Crie um bucket de armazenamento
3. Configure as seguintes regras de segurança:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /questoes/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Deploy no GitHub Pages

1. Crie um repositório no GitHub
2. Faça upload de todos os arquivos para o repositório
3. Vá para as configurações do repositório
4. Na seção "GitHub Pages", selecione a branch principal (main ou master)
5. Clique em "Save" para publicar o site
6. Seu site estará disponível em `https://seu-usuario.github.io/nome-do-repositorio`

## Uso do Sistema

1. Acesse o site publicado
2. Crie uma conta ou faça login
3. Comece a cadastrar questões
4. Use as funcionalidades de responder e imprimir questões

## Limitações e Considerações

- O Firebase possui limites gratuitos para operações, armazenamento e transferência de dados
- Para uso intensivo, considere o plano Blaze (pago) do Firebase
- As imagens são armazenadas no Firebase Storage, o que pode consumir sua cota de armazenamento

## Suporte

Para problemas ou dúvidas, abra uma issue no repositório GitHub.

---

Desenvolvido com ❤️ para o Sistema de Questões
