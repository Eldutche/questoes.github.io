// Funcionalidades principais do aplicativo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página inicial
    const isHomePage = window.location.pathname === '/' || 
                       window.location.pathname === '/index.html' ||
                       window.location.href.endsWith('index.html');
    
    if (isHomePage) {
        console.log('Página inicial carregada');
        // Código específico da página inicial
    }
    
    // Inicializar tooltips e popovers do Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
});

// Funções utilitárias para manipulação de questões
const questoesUtils = {
    // Formatar data para exibição
    formatarData: function(timestamp) {
        if (!timestamp) return 'Data desconhecida';
        
        const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },
    
    // Gerar ID único para novas questões
    gerarId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
    },
    
    // Converter imagem para base64 (para preview)
    converterImagemParaBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },
    
    // Validar questão antes de salvar
    validarQuestao: function(questao) {
        if (!questao.enunciado || questao.enunciado.trim() === '') {
            return { valido: false, mensagem: 'O enunciado da questão é obrigatório' };
        }
        
        if (!questao.materia || questao.materia.trim() === '') {
            return { valido: false, mensagem: 'A matéria é obrigatória' };
        }
        
        if (!questao.assunto || questao.assunto.trim() === '') {
            return { valido: false, mensagem: 'O assunto é obrigatório' };
        }
        
        if (questao.tipo === 'multipla_escolha') {
            if (!questao.alternativas || questao.alternativas.length < 2) {
                return { valido: false, mensagem: 'A questão deve ter pelo menos 2 alternativas' };
            }
            
            if (questao.alternativaCorreta === undefined || questao.alternativaCorreta === null) {
                return { valido: false, mensagem: 'É necessário definir a alternativa correta' };
            }
        }
        
        return { valido: true };
    },
    
    // Salvar questão no Firestore
    salvarQuestao: async function(questao) {
        try {
            // Validar a questão
            const validacao = this.validarQuestao(questao);
            if (!validacao.valido) {
                throw new Error(validacao.mensagem);
            }
            
            // Verificar se o usuário está autenticado
            const usuario = auth.currentUser;
            if (!usuario) {
                throw new Error('Usuário não autenticado');
            }
            
            // Preparar dados da questão
            const dadosQuestao = {
                ...questao,
                usuarioId: usuario.uid,
                usuarioNome: usuario.displayName || usuario.email,
                dataCriacao: questao.id ? questao.dataCriacao : firebase.firestore.FieldValue.serverTimestamp(),
                dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Se tem imagem para upload
            if (questao.imagemFile) {
                const nomeArquivo = `questoes/${usuario.uid}/${questao.id || this.gerarId()}_${Date.now()}`;
                const storageRef = storage.ref(nomeArquivo);
                
                // Fazer upload da imagem
                await storageRef.put(questao.imagemFile);
                
                // Obter URL da imagem
                const imagemUrl = await storageRef.getDownloadURL();
                dadosQuestao.imagemUrl = imagemUrl;
            }
            
            // Remover propriedades temporárias
            delete dadosQuestao.imagemFile;
            
            // Salvar no Firestore
            if (questao.id) {
                // Atualizar questão existente
                await db.collection('questoes').doc(questao.id).update(dadosQuestao);
                return { sucesso: true, id: questao.id, mensagem: 'Questão atualizada com sucesso' };
            } else {
                // Criar nova questão
                const novoId = this.gerarId();
                dadosQuestao.id = novoId;
                await db.collection('questoes').doc(novoId).set(dadosQuestao);
                return { sucesso: true, id: novoId, mensagem: 'Questão criada com sucesso' };
            }
        } catch (error) {
            console.error('Erro ao salvar questão:', error);
            return { sucesso: false, mensagem: error.message };
        }
    },
    
    // Excluir questão do Firestore
    excluirQuestao: async function(questaoId) {
        try {
            // Verificar se o usuário está autenticado
            const usuario = auth.currentUser;
            if (!usuario) {
                throw new Error('Usuário não autenticado');
            }
            
            // Obter a questão para verificar permissões e imagem
            const questaoRef = db.collection('questoes').doc(questaoId);
            const questaoDoc = await questaoRef.get();
            
            if (!questaoDoc.exists) {
                throw new Error('Questão não encontrada');
            }
            
            const questaoData = questaoDoc.data();
            
            // Verificar se o usuário é o proprietário da questão
            if (questaoData.usuarioId !== usuario.uid) {
                throw new Error('Você não tem permissão para excluir esta questão');
            }
            
            // Se a questão tem imagem, excluir do Storage
            if (questaoData.imagemUrl) {
                try {
                    // Extrair o caminho da URL da imagem
                    const imagemRef = storage.refFromURL(questaoData.imagemUrl);
                    await imagemRef.delete();
                } catch (imageError) {
                    console.error('Erro ao excluir imagem:', imageError);
                    // Continuar mesmo se falhar a exclusão da imagem
                }
            }
            
            // Excluir a questão do Firestore
            await questaoRef.delete();
            
            return { sucesso: true, mensagem: 'Questão excluída com sucesso' };
        } catch (error) {
            console.error('Erro ao excluir questão:', error);
            return { sucesso: false, mensagem: error.message };
        }
    },
    
    // Buscar questões com filtros
    buscarQuestoes: async function(filtros = {}) {
        try {
            // Verificar se o usuário está autenticado
            const usuario = auth.currentUser;
            if (!usuario) {
                throw new Error('Usuário não autenticado');
            }
            
            // Iniciar a consulta
            let query = db.collection('questoes');
            
            // Aplicar filtros
            if (filtros.materia && filtros.materia !== 'todas') {
                query = query.where('materia', '==', filtros.materia);
            }
            
            if (filtros.assunto && filtros.assunto !== 'todos') {
                query = query.where('assunto', '==', filtros.assunto);
            }
            
            if (filtros.tipo && filtros.tipo !== 'todos') {
                query = query.where('tipo', '==', filtros.tipo);
            }
            
            if (filtros.apenasMinhas) {
                query = query.where('usuarioId', '==', usuario.uid);
            }
            
            // Ordenar resultados
            if (filtros.ordenarPor) {
                query = query.orderBy(filtros.ordenarPor, filtros.ordem || 'desc');
            } else {
                query = query.orderBy('dataCriacao', 'desc');
            }
            
            // Executar a consulta
            const snapshot = await query.get();
            
            // Processar resultados
            const questoes = [];
            snapshot.forEach(doc => {
                const questao = doc.data();
                questoes.push(questao);
            });
            
            return { sucesso: true, questoes };
        } catch (error) {
            console.error('Erro ao buscar questões:', error);
            return { sucesso: false, mensagem: error.message, questoes: [] };
        }
    },
    
    // Obter lista de matérias e assuntos disponíveis
    obterMateriasEAssuntos: async function() {
        try {
            // Verificar se o usuário está autenticado
            const usuario = auth.currentUser;
            if (!usuario) {
                throw new Error('Usuário não autenticado');
            }
            
            // Buscar todas as questões
            const snapshot = await db.collection('questoes').get();
            
            // Extrair matérias e assuntos únicos
            const materias = new Set();
            const assuntosPorMateria = {};
            
            snapshot.forEach(doc => {
                const questao = doc.data();
                if (questao.materia) {
                    materias.add(questao.materia);
                    
                    if (!assuntosPorMateria[questao.materia]) {
                        assuntosPorMateria[questao.materia] = new Set();
                    }
                    
                    if (questao.assunto) {
                        assuntosPorMateria[questao.materia].add(questao.assunto);
                    }
                }
            });
            
            // Converter Sets para arrays
            const materiasArray = Array.from(materias).sort();
            const assuntosArray = {};
            
            for (const materia in assuntosPorMateria) {
                assuntosArray[materia] = Array.from(assuntosPorMateria[materia]).sort();
            }
            
            return {
                sucesso: true,
                materias: materiasArray,
                assuntos: assuntosArray
            };
        } catch (error) {
            console.error('Erro ao obter matérias e assuntos:', error);
            return {
                sucesso: false,
                mensagem: error.message,
                materias: [],
                assuntos: {}
            };
        }
    },
    
    // Gerar PDF com questões selecionadas
    gerarPDF: async function(questoes, opcoes = {}) {
        try {
            // Verificar se há questões
            if (!questoes || questoes.length === 0) {
                throw new Error('Nenhuma questão selecionada para impressão');
            }
            
            // Criar elemento temporário para o conteúdo do PDF
            const container = document.createElement('div');
            container.className = 'pdf-container';
            container.style.display = 'none';
            document.body.appendChild(container);
            
            // Adicionar cabeçalho
            const header = document.createElement('div');
            header.className = 'pdf-header';
            header.innerHTML = `
                <h1>${opcoes.titulo || 'Lista de Questões'}</h1>
                <p>${opcoes.subtitulo || ''}</p>
                <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
            `;
            container.appendChild(header);
            
            // Adicionar questões
            for (let i = 0; i < questoes.length; i++) {
                const questao = questoes[i];
                
                const questaoDiv = document.createElement('div');
                questaoDiv.className = 'questao-para-impressao';
                
                let questaoHTML = `
                    <div class="questao-numero">Questão ${i + 1}</div>
                    <div class="questao-info">
                        <span>Matéria: ${questao.materia}</span>
                        <span>Assunto: ${questao.assunto}</span>
                    </div>
                    <div class="questao-enunciado">${questao.enunciado}</div>
                `;
                
                // Adicionar imagem se existir
                if (questao.imagemUrl) {
                    questaoHTML += `<div class="questao-imagem-container">
                        <img src="${questao.imagemUrl}" alt="Imagem da questão" class="questao-imagem">
                    </div>`;
                }
                
                // Adicionar alternativas para questões de múltipla escolha
                if (questao.tipo === 'multipla_escolha' && questao.alternativas) {
                    questaoHTML += '<div class="questao-alternativas">';
                    
                    for (let j = 0; j < questao.alternativas.length; j++) {
                        const letra = String.fromCharCode(65 + j); // A, B, C, D, E...
                        
                        // Se a opção de mostrar respostas estiver ativada
                        const isCorreta = j === questao.alternativaCorreta;
                        const classeCorreta = opcoes.mostrarRespostas && isCorreta ? 'alternativa-correta' : '';
                        
                        questaoHTML += `
                            <div class="alternativa ${classeCorreta}">
                                <span class="alternativa-letra">${letra})</span>
                                <span class="alternativa-texto">${questao.alternativas[j]}</span>
                            </div>
                        `;
                    }
                    
                    questaoHTML += '</div>';
                }
                
                questaoDiv.innerHTML = questaoHTML;
                container.appendChild(questaoDiv);
                
                // Adicionar quebra de página, exceto na última questão
                if (i < questoes.length - 1) {
                    const breakDiv = document.createElement('div');
                    breakDiv.className = 'page-break';
                    container.appendChild(breakDiv);
                }
            }
            
            // Usar html2pdf para gerar o PDF
            const pdfOptions = {
                margin: 10,
                filename: opcoes.nomeArquivo || 'questoes.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            // Carregar html2pdf dinamicamente
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            document.head.appendChild(script);
            
            return new Promise((resolve, reject) => {
                script.onload = async () => {
                    try {
                        await html2pdf().set(pdfOptions).from(container).save();
                        
                        // Limpar elementos temporários
                        setTimeout(() => {
                            document.body.removeChild(container);
                            document.head.removeChild(script);
                        }, 1000);
                        
                        resolve({ sucesso: true, mensagem: 'PDF gerado com sucesso' });
                    } catch (error) {
                        reject(error);
                    }
                };
                
                script.onerror = () => {
                    reject(new Error('Erro ao carregar biblioteca de geração de PDF'));
                };
            });
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            return { sucesso: false, mensagem: error.message };
        }
    }
};

// Exportar para uso em outros arquivos
window.questoesUtils = questoesUtils;
