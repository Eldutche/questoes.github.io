// Funcionalidades específicas da página de questões
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de questões
    const isQuestoesPage = window.location.pathname.includes('/questoes.html');
    
    if (!isQuestoesPage) return;
    
    console.log('Página de questões carregada');
    
    // Referências aos elementos do DOM
    const filtroMateria = document.getElementById('filtroMateria');
    const filtroAssunto = document.getElementById('filtroAssunto');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroApenasMinhas = document.getElementById('filtroApenasMinhas');
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');
    const btnNovaQuestao = document.getElementById('btnNovaQuestao');
    const listaQuestoes = document.getElementById('listaQuestoes');
    const loadingQuestoes = document.getElementById('loadingQuestoes');
    const nenhumaQuestao = document.getElementById('nenhumaQuestao');
    const paginacaoContainer = document.getElementById('paginacaoContainer');
    const paginacao = document.getElementById('paginacao');
    
    // Modal de questão
    const questaoModal = new bootstrap.Modal(document.getElementById('questaoModal'));
    const questaoModalTitle = document.getElementById('questaoModalTitle');
    const questaoForm = document.getElementById('questaoForm');
    const questaoId = document.getElementById('questaoId');
    const questaoMateria = document.getElementById('questaoMateria');
    const questaoAssunto = document.getElementById('questaoAssunto');
    const questaoTipo = document.getElementById('questaoTipo');
    const questaoEnunciado = document.getElementById('questaoEnunciado');
    const questaoImagem = document.getElementById('questaoImagem');
    const previewImagemContainer = document.getElementById('previewImagemContainer');
    const previewImagem = document.getElementById('previewImagem');
    const btnRemoverImagem = document.getElementById('btnRemoverImagem');
    const alternativasContainer = document.getElementById('alternativasContainer');
    const alternativasList = document.getElementById('alternativasList');
    const btnAdicionarAlternativa = document.getElementById('btnAdicionarAlternativa');
    const respostaContainer = document.getElementById('respostaContainer');
    const questaoResposta = document.getElementById('questaoResposta');
    const btnSalvarQuestao = document.getElementById('btnSalvarQuestao');
    
    // Modal de confirmação de exclusão
    const confirmarExclusaoModal = new bootstrap.Modal(document.getElementById('confirmarExclusaoModal'));
    const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');
    
    // Variáveis de estado
    let questoesAtuais = [];
    let questaoAtual = null;
    let imagemAlterada = false;
    let paginaAtual = 1;
    const itensPorPagina = 10;
    
    // Verificar autenticação
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário autenticado, carregar dados
            carregarMateriasEAssuntos();
            carregarQuestoes();
        } else {
            // Usuário não autenticado, redirecionar para a página inicial
            window.location.href = '../index.html';
        }
    });
    
    // Carregar matérias e assuntos para os filtros
    async function carregarMateriasEAssuntos() {
        try {
            const resultado = await questoesUtils.obterMateriasEAssuntos();
            
            if (resultado.sucesso) {
                // Preencher select de matérias
                filtroMateria.innerHTML = '<option value="todas" selected>Todas</option>';
                resultado.materias.forEach(materia => {
                    const option = document.createElement('option');
                    option.value = materia;
                    option.textContent = materia;
                    filtroMateria.appendChild(option);
                });
                
                // Preencher datalist de matérias para o formulário
                const materiasList = document.getElementById('materiasList');
                materiasList.innerHTML = '';
                resultado.materias.forEach(materia => {
                    const option = document.createElement('option');
                    option.value = materia;
                    materiasList.appendChild(option);
                });
                
                // Configurar evento de mudança de matéria para atualizar assuntos
                filtroMateria.addEventListener('change', () => {
                    const materiaSelected = filtroMateria.value;
                    
                    if (materiaSelected === 'todas') {
                        // Mostrar todos os assuntos
                        filtroAssunto.innerHTML = '<option value="todos" selected>Todos</option>';
                        
                        for (const materia in resultado.assuntos) {
                            resultado.assuntos[materia].forEach(assunto => {
                                const option = document.createElement('option');
                                option.value = assunto;
                                option.textContent = `${assunto} (${materia})`;
                                filtroAssunto.appendChild(option);
                            });
                        }
                    } else if (resultado.assuntos[materiaSelected]) {
                        // Mostrar apenas assuntos da matéria selecionada
                        filtroAssunto.innerHTML = '<option value="todos" selected>Todos</option>';
                        
                        resultado.assuntos[materiaSelected].forEach(assunto => {
                            const option = document.createElement('option');
                            option.value = assunto;
                            option.textContent = assunto;
                            filtroAssunto.appendChild(option);
                        });
                    }
                });
                
                // Preencher datalist de assuntos para o formulário
                const assuntosList = document.getElementById('assuntosList');
                assuntosList.innerHTML = '';
                
                for (const materia in resultado.assuntos) {
                    resultado.assuntos[materia].forEach(assunto => {
                        const option = document.createElement('option');
                        option.value = assunto;
                        assuntosList.appendChild(option);
                    });
                }
            } else {
                console.error('Erro ao carregar matérias e assuntos:', resultado.mensagem);
                showToast('Erro ao carregar matérias e assuntos', 'danger');
            }
        } catch (error) {
            console.error('Erro ao carregar matérias e assuntos:', error);
            showToast('Erro ao carregar matérias e assuntos', 'danger');
        }
    }
    
    // Carregar questões com filtros
    async function carregarQuestoes() {
        try {
            // Mostrar loading
            loadingQuestoes.classList.remove('d-none');
            nenhumaQuestao.classList.add('d-none');
            listaQuestoes.innerHTML = '';
            
            // Obter filtros
            const filtros = {
                materia: filtroMateria.value,
                assunto: filtroAssunto.value,
                tipo: filtroTipo.value,
                apenasMinhas: filtroApenasMinhas.checked
            };
            
            // Buscar questões
            const resultado = await questoesUtils.buscarQuestoes(filtros);
            
            // Ocultar loading
            loadingQuestoes.classList.add('d-none');
            
            if (resultado.sucesso) {
                questoesAtuais = resultado.questoes;
                
                if (questoesAtuais.length === 0) {
                    // Nenhuma questão encontrada
                    nenhumaQuestao.classList.remove('d-none');
                    paginacaoContainer.classList.add('d-none');
                } else {
                    // Exibir questões
                    exibirQuestoesPaginadas();
                }
            } else {
                console.error('Erro ao carregar questões:', resultado.mensagem);
                showToast('Erro ao carregar questões: ' + resultado.mensagem, 'danger');
                nenhumaQuestao.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Erro ao carregar questões:', error);
            showToast('Erro ao carregar questões', 'danger');
            loadingQuestoes.classList.add('d-none');
            nenhumaQuestao.classList.remove('d-none');
        }
    }
    
    // Exibir questões com paginação
    function exibirQuestoesPaginadas() {
        // Calcular paginação
        const totalPaginas = Math.ceil(questoesAtuais.length / itensPorPagina);
        
        // Ajustar página atual se necessário
        if (paginaAtual > totalPaginas) {
            paginaAtual = 1;
        }
        
        // Calcular índices
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = Math.min(inicio + itensPorPagina, questoesAtuais.length);
        
        // Limpar lista
        listaQuestoes.innerHTML = '';
        
        // Exibir questões da página atual
        for (let i = inicio; i < fim; i++) {
            const questao = questoesAtuais[i];
            const questaoElement = criarElementoQuestao(questao);
            listaQuestoes.appendChild(questaoElement);
        }
        
        // Atualizar paginação
        if (totalPaginas > 1) {
            paginacaoContainer.classList.remove('d-none');
            gerarPaginacao(totalPaginas);
        } else {
            paginacaoContainer.classList.add('d-none');
        }
    }
    
    // Gerar elementos de paginação
    function gerarPaginacao(totalPaginas) {
        paginacao.innerHTML = '';
        
        // Botão anterior
        const itemAnterior = document.createElement('li');
        itemAnterior.className = `page-item ${paginaAtual === 1 ? 'disabled' : ''}`;
        
        const linkAnterior = document.createElement('a');
        linkAnterior.className = 'page-link';
        linkAnterior.href = '#';
        linkAnterior.setAttribute('aria-label', 'Anterior');
        linkAnterior.innerHTML = '<span aria-hidden="true">&laquo;</span>';
        
        linkAnterior.addEventListener('click', (e) => {
            e.preventDefault();
            if (paginaAtual > 1) {
                paginaAtual--;
                exibirQuestoesPaginadas();
            }
        });
        
        itemAnterior.appendChild(linkAnterior);
        paginacao.appendChild(itemAnterior);
        
        // Páginas
        for (let i = 1; i <= totalPaginas; i++) {
            const item = document.createElement('li');
            item.className = `page-item ${i === paginaAtual ? 'active' : ''}`;
            
            const link = document.createElement('a');
            link.className = 'page-link';
            link.href = '#';
            link.textContent = i;
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                paginaAtual = i;
                exibirQuestoesPaginadas();
            });
            
            item.appendChild(link);
            paginacao.appendChild(item);
        }
        
        // Botão próximo
        const itemProximo = document.createElement('li');
        itemProximo.className = `page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}`;
        
        const linkProximo = document.createElement('a');
        linkProximo.className = 'page-link';
        linkProximo.href = '#';
        linkProximo.setAttribute('aria-label', 'Próximo');
        linkProximo.innerHTML = '<span aria-hidden="true">&raquo;</span>';
        
        linkProximo.addEventListener('click', (e) => {
            e.preventDefault();
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                exibirQuestoesPaginadas();
            }
        });
        
        itemProximo.appendChild(linkProximo);
        paginacao.appendChild(itemProximo);
    }
    
    // Criar elemento HTML para uma questão
    function criarElementoQuestao(questao) {
        const card = document.createElement('div');
        card.className = 'card questao-card mb-3';
        
        // Verificar se o usuário atual é o proprietário da questão
        const isProprietario = auth.currentUser && questao.usuarioId === auth.currentUser.uid;
        
        // Criar cabeçalho do card
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header d-flex justify-content-between align-items-center';
        
        const headerInfo = document.createElement('div');
        headerInfo.innerHTML = `
            <h5 class="mb-0">${questao.materia} - ${questao.assunto}</h5>
            <small class="text-muted">
                ${questao.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Dissertativa'} | 
                Criado por: ${questao.usuarioNome || 'Usuário'} | 
                Data: ${questoesUtils.formatarData(questao.dataCriacao)}
            </small>
        `;
        
        const headerButtons = document.createElement('div');
        headerButtons.className = 'btn-group';
        
        if (isProprietario) {
            // Botão de editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn btn-sm btn-outline-primary';
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.title = 'Editar questão';
            btnEditar.addEventListener('click', () => abrirModalEditarQuestao(questao));
            headerButtons.appendChild(btnEditar);
            
            // Botão de excluir
            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn btn-sm btn-outline-danger';
            btnExcluir.innerHTML = '<i class="fas fa-trash"></i>';
            btnExcluir.title = 'Excluir questão';
            btnExcluir.addEventListener('click', () => abrirModalConfirmarExclusao(questao));
            headerButtons.appendChild(btnExcluir);
        }
        
        cardHeader.appendChild(headerInfo);
        cardHeader.appendChild(headerButtons);
        
        // Criar corpo do card
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        // Enunciado
        const enunciado = document.createElement('p');
        enunciado.className = 'card-text';
        enunciado.textContent = questao.enunciado;
        cardBody.appendChild(enunciado);
        
        // Imagem (se existir)
        if (questao.imagemUrl) {
            const imagemContainer = document.createElement('div');
            imagemContainer.className = 'text-center mb-3';
            
            const imagem = document.createElement('img');
            imagem.src = questao.imagemUrl;
            imagem.className = 'questao-imagem';
            imagem.alt = 'Imagem da questão';
            
            imagemContainer.appendChild(imagem);
            cardBody.appendChild(imagemContainer);
        }
        
        // Alternativas (para múltipla escolha)
        if (questao.tipo === 'multipla_escolha' && questao.alternativas) {
            const alternativasContainer = document.createElement('div');
            alternativasContainer.className = 'mt-3';
            
            for (let i = 0; i < questao.alternativas.length; i++) {
                const alternativa = document.createElement('div');
                alternativa.className = 'alternativa';
                
                const letra = String.fromCharCode(65 + i); // A, B, C, D, E...
                const isCorreta = i === questao.alternativaCorreta;
                
                alternativa.innerHTML = `
                    <span class="alternativa-letra">${letra})</span>
                    <span class="alternativa-texto">${questao.alternativas[i]}</span>
                    ${isCorreta ? '<span class="badge bg-success ms-2">Correta</span>' : ''}
                `;
                
                alternativasContainer.appendChild(alternativa);
            }
            
            cardBody.appendChild(alternativasContainer);
        }
        
        // Resposta (para dissertativa)
        if (questao.tipo === 'dissertativa' && questao.resposta) {
            const respostaContainer = document.createElement('div');
            respostaContainer.className = 'mt-3';
            
            const respostaTitle = document.createElement('h6');
            respostaTitle.textContent = 'Resposta Esperada:';
            
            const respostaText = document.createElement('p');
            respostaText.className = 'card-text';
            respostaText.textContent = questao.resposta;
            
            respostaContainer.appendChild(respostaTitle);
            respostaContainer.appendChild(respostaText);
            cardBody.appendChild(respostaContainer);
        }
        
        card.appendChild(cardHeader);
        card.appendChild(cardBody);
        
        return card;
    }
    
    // Abrir modal para criar nova questão
    function abrirModalNovaQuestao() {
        // Limpar formulário
        questaoForm.reset();
        questaoId.value = '';
        questaoModalTitle.textContent = 'Nova Questão';
        
        // Limpar preview de imagem
        previewImagemContainer.classList.add('d-none');
        previewImagem.src = '';
        
        // Resetar alternativas
        resetarAlternativas();
        
        // Mostrar/ocultar campos conforme o tipo
        atualizarCamposPorTipo('multipla_escolha');
        
        // Resetar variáveis de estado
        questaoAtual = null;
        imagemAlterada = false;
        
        // Abrir modal
        questaoModal.show();
    }
    
    // Abrir modal para editar questão
    function abrirModalEditarQuestao(questao) {
        // Preencher formulário
        questaoId.value = questao.id;
        questaoMateria.value = questao.materia;
        questaoAssunto.value = questao.assunto;
        questaoTipo.value = questao.tipo;
        questaoEnunciado.value = questao.enunciado;
        
        // Atualizar título do modal
        questaoModalTitle.textContent = 'Editar Questão';
        
        // Mostrar preview de imagem se existir
        if (questao.imagemUrl) {
            previewImagem.src = questao.imagemUrl;
            previewImagemContainer.classList.remove('d-none');
        } else {
            previewImagemContainer.classList.add('d-none');
        }
        
        // Mostrar/ocultar campos conforme o tipo
        atualizarCamposPorTipo(questao.tipo);
        
        // Preencher alternativas (para múltipla escolha)
        if (questao.tipo === 'multipla_escolha' && questao.alternativas) {
            preencherAlternativas(questao.alternativas, questao.alternativaCorreta);
        }
        
        // Preencher resposta (para dissertativa)
        if (questao.tipo === 'dissertativa' && questao.resposta) {
            questaoResposta.value = questao.resposta;
        }
        
        // Atualizar variáveis de estado
        questaoAtual = { ...questao };
        imagemAlterada = false;
        
        // Abrir modal
        questaoModal.show();
    }
    
    // Abrir modal para confirmar exclusão
    function abrirModalConfirmarExclusao(questao) {
        // Armazenar questão atual
        questaoAtual = questao;
        
        // Abrir modal
        confirmarExclusaoModal.show();
    }
    
    // Atualizar campos do formulário conforme o tipo de questão
    function atualizarCamposPorTipo(tipo) {
        if (tipo === 'multipla_escolha') {
            alternativasContainer.classList.remove('d-none');
            respostaContainer.classList.add('d-none');
        } else {
            alternativasContainer.classList.add('d-none');
            respostaContainer.classList.remove('d-none');
        }
    }
    
    // Resetar alternativas para o padrão (duas alternativas vazias)
    function resetarAlternativas() {
        alternativasList.innerHTML = `
            <div class="alternativa-item mb-2">
                <div class="input-group">
                    <div class="input-group-text">
                        <input type="radio" name="alternativaCorreta" value="0" required checked>
                    </div>
                    <input type="text" class="form-control alternativa-texto" placeholder="Alternativa A" required>
                    <button type="button" class="btn btn-outline-danger remover-alternativa">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="alternativa-item mb-2">
                <div class="input-group">
                    <div class="input-group-text">
                        <input type="radio" name="alternativaCorreta" value="1" required>
                    </div>
                    <input type="text" class="form-control alternativa-texto" placeholder="Alternativa B" required>
                    <button type="button" class="btn btn-outline-danger remover-alternativa">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Adicionar event listeners para botões de remover
        adicionarEventListenersRemoverAlternativa();
    }
    
    // Preencher alternativas com valores existentes
    function preencherAlternativas(alternativas, alternativaCorreta) {
        alternativasList.innerHTML = '';
        
        for (let i = 0; i < alternativas.length; i++) {
            const letra = String.fromCharCode(65 + i); // A, B, C, D, E...
            
            const alternativaItem = document.createElement('div');
            alternativaItem.className = 'alternativa-item mb-2';
            
            alternativaItem.innerHTML = `
                <div class="input-group">
                    <div class="input-group-text">
                        <input type="radio" name="alternativaCorreta" value="${i}" required ${i === alternativaCorreta ? 'checked' : ''}>
                    </div>
                    <input type="text" class="form-control alternativa-texto" placeholder="Alternativa ${letra}" required value="${alternativas[i]}">
                    <button type="button" class="btn btn-outline-danger remover-alternativa">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            alternativasList.appendChild(alternativaItem);
        }
        
        // Adicionar event listeners para botões de remover
        adicionarEventListenersRemoverAlternativa();
    }
    
    // Adicionar event listeners para botões de remover alternativa
    function adicionarEventListenersRemoverAlternativa() {
        const botoesRemover = document.querySelectorAll('.remover-alternativa');
        
        botoesRemover.forEach(botao => {
            botao.addEventListener('click', function() {
                const alternativaItem = this.closest('.alternativa-item');
                
                // Verificar se há pelo menos 2 alternativas
                if (document.querySelectorAll('.alternativa-item').length > 2) {
                    alternativaItem.remove();
                    
                    // Atualizar valores dos inputs de rádio
                    atualizarValoresRadio();
                } else {
                    showToast('A questão deve ter pelo menos 2 alternativas', 'warning');
                }
            });
        });
    }
    
    // Atualizar valores dos inputs de rádio após remover alternativa
    function atualizarValoresRadio() {
        const radios = document.querySelectorAll('input[name="alternativaCorreta"]');
        
        radios.forEach((radio, index) => {
            radio.value = index;
        });
    }
    
    // Adicionar nova alternativa
    function adicionarAlternativa() {
        const alternativas = document.querySelectorAll('.alternativa-item');
        const novoIndex = alternativas.length;
        const letra = String.fromCharCode(65 + novoIndex); // A, B, C, D, E...
        
        const alternativaItem = document.createElement('div');
        alternativaItem.className = 'alternativa-item mb-2';
        
        alternativaItem.innerHTML = `
            <div class="input-group">
                <div class="input-group-text">
                    <input type="radio" name="alternativaCorreta" value="${novoIndex}" required>
                </div>
                <input type="text" class="form-control alternativa-texto" placeholder="Alternativa ${letra}" required>
                <button type="button" class="btn btn-outline-danger remover-alternativa">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        alternativasList.appendChild(alternativaItem);
        
        // Adicionar event listener para o botão de remover
        const botaoRemover = alternativaItem.querySelector('.remover-alternativa');
        botaoRemover.addEventListener('click', function() {
            if (document.querySelectorAll('.alternativa-item').length > 2) {
                alternativaItem.remove();
                atualizarValoresRadio();
            } else {
                showToast('A questão deve ter pelo menos 2 alternativas', 'warning');
            }
        });
    }
    
    // Salvar questão
    async function salvarQuestao() {
        try {
            // Verificar se o formulário é válido
            if (!questaoForm.checkValidity()) {
                questaoForm.reportValidity();
                return;
            }
            
            // Obter dados do formulário
            const id = questaoId.value;
            const materia = questaoMateria.value;
            const assunto = questaoAssunto.value;
            const tipo = questaoTipo.value;
            const enunciado = questaoEnunciado.value;
            
            // Preparar objeto da questão
            const questao = {
                id: id || null,
                materia,
                assunto,
                tipo,
                enunciado
            };
            
            // Adicionar dados específicos conforme o tipo
            if (tipo === 'multipla_escolha') {
                // Obter alternativas
                const alternativasElements = document.querySelectorAll('.alternativa-texto');
                const alternativas = Array.from(alternativasElements).map(el => el.value);
                
                // Obter alternativa correta
                const alternativaCorretaElement = document.querySelector('input[name="alternativaCorreta"]:checked');
                const alternativaCorreta = alternativaCorretaElement ? parseInt(alternativaCorretaElement.value) : null;
                
                questao.alternativas = alternativas;
                questao.alternativaCorreta = alternativaCorreta;
            } else {
                // Questão dissertativa
                questao.resposta = questaoResposta.value;
            }
            
            // Verificar se há imagem para upload
            if (questaoImagem.files.length > 0 || imagemAlterada) {
                if (questaoImagem.files.length > 0) {
                    const arquivo = questaoImagem.files[0];
                    
                    // Verificar tamanho (máximo 5MB)
                    if (arquivo.size > 5 * 1024 * 1024) {
                        showToast('A imagem deve ter no máximo 5MB', 'warning');
                        return;
                    }
                    
                    // Verificar tipo
                    if (!arquivo.type.startsWith('image/')) {
                        showToast('O arquivo deve ser uma imagem', 'warning');
                        return;
                    }
                    
                    questao.imagemFile = arquivo;
                }
            } else if (questaoAtual && questaoAtual.imagemUrl) {
                // Manter a imagem existente
                questao.imagemUrl = questaoAtual.imagemUrl;
            }
            
            // Desabilitar botão de salvar
            btnSalvarQuestao.disabled = true;
            btnSalvarQuestao.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Salvando...';
            
            // Salvar questão
            const resultado = await questoesUtils.salvarQuestao(questao);
            
            // Reabilitar botão
            btnSalvarQuestao.disabled = false;
            btnSalvarQuestao.innerHTML = 'Salvar';
            
            if (resultado.sucesso) {
                showToast(resultado.mensagem, 'success');
                questaoModal.hide();
                carregarQuestoes();
            } else {
                showToast(resultado.mensagem, 'danger');
            }
        } catch (error) {
            console.error('Erro ao salvar questão:', error);
            showToast('Erro ao salvar questão', 'danger');
            
            // Reabilitar botão
            btnSalvarQuestao.disabled = false;
            btnSalvarQuestao.innerHTML = 'Salvar';
        }
    }
    
    // Excluir questão
    async function excluirQuestao() {
        try {
            if (!questaoAtual || !questaoAtual.id) {
                showToast('Questão não encontrada', 'danger');
                return;
            }
            
            // Desabilitar botão
            btnConfirmarExclusao.disabled = true;
            btnConfirmarExclusao.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Excluindo...';
            
            // Excluir questão
            const resultado = await questoesUtils.excluirQuestao(questaoAtual.id);
            
            // Reabilitar botão
            btnConfirmarExclusao.disabled = false;
            btnConfirmarExclusao.innerHTML = 'Excluir';
            
            if (resultado.sucesso) {
                showToast(resultado.mensagem, 'success');
                confirmarExclusaoModal.hide();
                carregarQuestoes();
            } else {
                showToast(resultado.mensagem, 'danger');
            }
        } catch (error) {
            console.error('Erro ao excluir questão:', error);
            showToast('Erro ao excluir questão', 'danger');
            
            // Reabilitar botão
            btnConfirmarExclusao.disabled = false;
            btnConfirmarExclusao.innerHTML = 'Excluir';
        }
    }
    
    // Event listeners
    
    // Filtros
    btnAplicarFiltros.addEventListener('click', () => {
        paginaAtual = 1;
        carregarQuestoes();
    });
    
    btnLimparFiltros.addEventListener('click', () => {
        filtroMateria.value = 'todas';
        filtroAssunto.value = 'todos';
        filtroTipo.value = 'todos';
        filtroApenasMinhas.checked = false;
        paginaAtual = 1;
        carregarQuestoes();
    });
    
    // Nova questão
    btnNovaQuestao.addEventListener('click', abrirModalNovaQuestao);
    
    // Tipo de questão
    questaoTipo.addEventListener('change', () => {
        atualizarCamposPorTipo(questaoTipo.value);
    });
    
    // Preview de imagem
    questaoImagem.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const arquivo = e.target.files[0];
            
            try {
                const imagemBase64 = await questoesUtils.converterImagemParaBase64(arquivo);
                previewImagem.src = imagemBase64;
                previewImagemContainer.classList.remove('d-none');
                imagemAlterada = true;
            } catch (error) {
                console.error('Erro ao converter imagem:', error);
                showToast('Erro ao carregar imagem', 'danger');
            }
        }
    });
    
    // Remover imagem
    btnRemoverImagem.addEventListener('click', () => {
        previewImagemContainer.classList.add('d-none');
        previewImagem.src = '';
        questaoImagem.value = '';
        imagemAlterada = true;
    });
    
    // Adicionar alternativa
    btnAdicionarAlternativa.addEventListener('click', adicionarAlternativa);
    
    // Salvar questão
    btnSalvarQuestao.addEventListener('click', salvarQuestao);
    
    // Confirmar exclusão
    btnConfirmarExclusao.addEventListener('click', excluirQuestao);
});
