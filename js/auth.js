// Gerenciamento de autenticação
document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos do DOM
    const userNotLoggedIn = document.getElementById('userNotLoggedIn');
    const userLoggedIn = document.getElementById('userLoggedIn');
    const userDisplayName = document.getElementById('userDisplayName');
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');
    const btnLogout = document.getElementById('btnLogout');
    const btnGoogleLogin = document.getElementById('btnGoogleLogin');
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    const mainContent = document.getElementById('mainContent');
    const authContainer = document.getElementById('authContainer');
    
    // Formulários
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Monitorar estado de autenticação
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário está logado
            userNotLoggedIn.classList.add('d-none');
            userLoggedIn.classList.remove('d-none');
            userDisplayName.textContent = user.displayName || user.email;
            mainContent.classList.remove('d-none');
            
            // Fechar modais se estiverem abertos
            loginModal.hide();
            registerModal.hide();
            
            console.log('Usuário logado:', user);
        } else {
            // Usuário não está logado
            userNotLoggedIn.classList.remove('d-none');
            userLoggedIn.classList.add('d-none');
            mainContent.classList.add('d-none');
            
            // Mostrar conteúdo de autenticação
            authContainer.innerHTML = `
                <div class="text-center">
                    <h2 class="mb-4">Bem-vindo ao Sistema de Questões</h2>
                    <p class="lead mb-4">Faça login para acessar todas as funcionalidades do sistema.</p>
                    <div class="d-grid gap-2 col-md-6 mx-auto">
                        <button class="btn btn-primary btn-lg" id="btnLoginWelcome">Entrar</button>
                        <button class="btn btn-outline-primary btn-lg" id="btnRegisterWelcome">Criar Conta</button>
                    </div>
                </div>
            `;
            
            // Adicionar event listeners para os novos botões
            document.getElementById('btnLoginWelcome').addEventListener('click', () => {
                loginModal.show();
            });
            
            document.getElementById('btnRegisterWelcome').addEventListener('click', () => {
                registerModal.show();
            });
            
            console.log('Usuário não logado');
        }
    });
    
    // Event listeners para botões de autenticação
    btnLogin.addEventListener('click', () => {
        loginModal.show();
    });
    
    btnRegister.addEventListener('click', () => {
        registerModal.show();
    });
    
    btnLogout.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                console.log('Usuário deslogado');
                showToast('Você saiu do sistema', 'success');
            })
            .catch(error => {
                console.error('Erro ao fazer logout:', error);
                showToast('Erro ao sair do sistema', 'danger');
            });
    });
    
    // Login com email e senha
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                console.log('Login bem-sucedido:', userCredential.user);
                showToast('Login realizado com sucesso!', 'success');
                loginForm.reset();
            })
            .catch(error => {
                console.error('Erro no login:', error);
                let errorMessage = 'Erro ao fazer login';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Usuário não encontrado';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Senha incorreta';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email inválido';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
                        break;
                }
                
                showToast(errorMessage, 'danger');
            });
    });
    
    // Registro com email e senha
    registerForm.addEventListener('submit', e => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Verificar se as senhas coincidem
        if (password !== confirmPassword) {
            showToast('As senhas não coincidem', 'danger');
            return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Atualizar o perfil do usuário com o nome
                return userCredential.user.updateProfile({
                    displayName: name
                }).then(() => {
                    console.log('Registro bem-sucedido:', userCredential.user);
                    showToast('Conta criada com sucesso!', 'success');
                    registerForm.reset();
                });
            })
            .catch(error => {
                console.error('Erro no registro:', error);
                let errorMessage = 'Erro ao criar conta';
                
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'Este email já está em uso';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email inválido';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Senha muito fraca';
                        break;
                }
                
                showToast(errorMessage, 'danger');
            });
    });
    
    // Login com Google
    btnGoogleLogin.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        auth.signInWithPopup(provider)
            .then(result => {
                console.log('Login com Google bem-sucedido:', result.user);
                showToast('Login com Google realizado com sucesso!', 'success');
            })
            .catch(error => {
                console.error('Erro no login com Google:', error);
                showToast('Erro ao fazer login com Google', 'danger');
            });
    });
});

// Função para exibir toast de notificação
function showToast(message, type = 'info') {
    // Verificar se já existe um container de toast
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Criar um novo toast
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remover o toast do DOM após ser ocultado
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
