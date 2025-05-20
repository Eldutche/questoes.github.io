// Funcionalidades específicas da página de imprimir questões
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de imprimir questões
    const isImprimirPage = window.location.pathname.includes('/imprimir.html');
    
    if (!isImprimirPage) return;
    
    console.log('Página de imprimir questões carregada');
    
    // Referências aos elementos do DOM
    const filtroMateria = document.getElementById('filtroMateria');
    const filtroAssunto = document.getElementById('filtroAssunto');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroOrdenacao = document.getElementById('filtroOrdenacao');
    const filtroApenasMinhas = document.getElementById('filtroApenasMinhas');
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');
    const tituloImpressao = document.getElementById('tituloImpressao');
    const subtituloImpressao = document.getElementById('subtituloImpressao');
    const mostrarRespostas = document.getElementById('mostrarRespostas');
    const btnGerarPDF = document.getElementById('btnGerarPDF');
    const questoesSelecionadasCount = document.getElementById('questoesSelecionadasCount');
    const loadingQuestoes = document.getElementById('loadingQuestoes');
    const nenhumaQuestao = document.getElementById('nenhumaQuestao');
    const listaQuestoes = document.getElementById('listaQuestoes');
    const selecionarTodas = document.getElementById('selecionarTodas');
    const tabelaQuestoes = document.getElementById('tabelaQuestoes');
    const paginacaoContainer = document.getElementById('paginacaoContainer');
    const paginacao = document.getElementById('paginacao');
    
    // Modal de visualização de questão
    const visualizarQuestaoModal = new bootstrap.Modal(document.getElementById('visualizarQuestaoModal'));
    const visualizarQuestaoConteudo = document.getElementById('visualizarQuestaoConteudo');
    
    // Variáveis de estado
    let questoesAtuais = [];
    let questoesSelecionadas = new Set();
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
            listaQuestoes.classList.add('d-none');
            
            // Obter filtros
            const [campo, ordem] = filtroOrdenacao.value.split('_');
            
            const filtros = {
                materia: filtroMateria.value,
                assunto: filtroAssunto.value,
                tipo: filtroTipo.value,
                apenasMinhas: filtroApenasMinhas.checked,
                ordenarPor: campo,
                ordem: ordem
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
                    listaQuestoes.classList.add('d-none');
                    paginacaoContainer.classList.add('d-none');
                    
                    // Desabilitar botão de gerar PDF
                    btnGerarPDF.disabled = true;
                    questoesSelecionadasCount.textContent = '0 questões selecionadas';
                } else {
                    // Exibir questões
                    listaQuestoes.classList.remove('d-none');
                    exibirQuestoesPaginadas();
                }
            } else {
                console.error('Erro ao carregar questões:', resultado.mensagem);
                showToast('Erro ao carregar questões: ' + resultado.mensagem, 'danger');
                nenhumaQuestao.classList.remove('d-none');
                listaQuestoes.classList.add('d-none');
            }
        } catch (error) {
            console.error('Erro ao carregar questões:', error);
            showToast('Erro ao carregar questões', 'danger');
            loadingQuestoes.classList.add('d-none');
            nenhumaQuestao.classList.remove('d-none');
            listaQuestoes.classList.add('d-none');
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
        
        // Limpar tabela
        tabelaQuestoes.innerHTML = '';
        
        // Exibir questões da página atual
        for (let i = inicio; i < fim; i++) {
            const questao = questoesAtuais[i];
            const row = criarLinhaQuestao(questao, i);
            tabelaQuestoes.appendChild(row);
        }
        
        // Atualizar paginação
        if (totalPaginas > 1) {
            paginacaoContainer.classList.remove('d-none');
            gerarPaginacao(totalPaginas);
        } else {
            paginacaoContainer.classList.add('d-none');
        }
        
        // Atualizar estado do checkbox "selecionar todas"
        atualizarSelecaoTodas();
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
    
    // Criar linha da tabela para uma questão
    function criarLinhaQuestao(questao, index) {
        const row = document.createElement('tr');
        
        // Verificar se a questão está selecionada
        const isSelected = questoesSelecionadas.has(questao.id);
        if (isSelected) {
            row.classList.add('table-primary');
        }
        
        // Célula de checkbox
        const tdCheckbox = document.createElement('td');
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'form-check';
        
        const checkbox = document.createElement('input');
        checkbox.className = 'form-check-input questao-checkbox';
        checkbox.type = 'checkbox';
        checkbox.checked = isSelected;
        checkbox.dataset.id = questao.id;
        checkbox.dataset.index = index;
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                questoesSelecionadas.add(questao.id);
                row.classList.add('table-primary');
            } else {
                questoesSelecionadas.delete(questao.id);
                row.classList.remove('table-primary');
            }
            
            // Atualizar contador e estado do botão
            atualizarContadorSelecionadas();
            
            // Atualizar estado do checkbox "selecionar todas"
            atualizarSelecaoTodas();
        });
        
        checkboxContainer.appendChild(checkbox);
        tdCheckbox.appendChild(checkboxContainer);
        
        // Célula de enunciado
        const tdEnunciado = document.createElement('td');
        const enunciadoText = questao.enunciado.length > 100 ? 
            questao.enunciado.substring(0, 100) + '...' : 
            questao.enunciado;
        
        const enunciadoLink = document.createElement('a');
        enunciadoLink.href = '#';
        enunciadoLink.textContent = enunciadoText;
        enunciadoLink.addEventListener('click', (e) => {
            e.preventDefault();
            visualizarQuestao(questao);
        });
        
        tdEnunciado.appendChild(enunciadoLink);
        
        // Célula de matéria
        const tdMateria = document.createElement('td');
        tdMateria.textContent = questao.materia;
        
        // Célula de assunto
        const tdAssunto = document.createElement('td');
        tdAssunto.textContent = questao.assunto;
        
        // Célula de tipo
        const tdTipo = document.createElement('td');
        tdTipo.textContent = questao.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Dissertativa';
        
        // Célula de data
        const tdData = document.createElement('td');
        tdData.textContent = questoesUtils.formatarData(questao.dataCriacao);
        
        // Adicionar células à linha
        row.appendChild(tdCheckbox);
        row.appendChild(tdEnunciado);
        row.appendChild(tdMateria);
        row.appendChild(tdAssunto);
        row.appendChild(tdTipo);
        row.appendChild(tdData);
        
        return row;
    }
    
    // Visualizar questão
    function visualizarQuestao(questao) {
        let conteudo = `
            <div class="mb-3">
                <h6>Matéria:</h6>
                <p>${questao.materia}</p>
            </div>
            <div class="mb-3">
                <h6>Assunto:</h6>
                <p>${questao.assunto}</p>
            </div>
            <div class="mb-3">
                <h6>Tipo:</h6>
                <p>${questao.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Dissertativa'}</p>
            </div>
            <div class="mb-3">
                <h6>Enunciado:</h6>
                <p>${questao.enunciado}</p>
            </div>
        `;
        
        // Imagem (se existir)
        if (questao.imagemUrl) {
            conteudo += `
                <div class="text-center mb-3">
                    <img src="${questao.imagemUrl}" class="questao-imagem" alt="Imagem da questão">
                </div>
            `;
        }
        
        // Alternativas (para múltipla escolha)
        if (questao.tipo === 'multipla_escolha' && questao.alternativas) {
            conteudo += '<div class="mb-3"><h6>Alternativas:</h6>';
            
            for (let i = 0; i < questao.alternativas.length; i++) {
                const letra = String.fromCharCode(65 + i); // A, B, C, D, E...
                const isCorreta = i === questao.alternativaCorreta;
                
                conteudo += `
                    <div class="alternativa ${isCorreta ? 'correta' : ''}">
                        <span class="alternativa-letra">${letra})</span>
                        <span class="alternativa-texto">${questao.alternativas[i]}</span>
                        ${isCorreta ? '<span class="badge bg-success ms-2">Correta</span>' : ''}
                    </div>
                `;
            }
            
            conteudo += '</div>';
        }
        
        // Resposta (para dissertativa)
        if (questao.tipo === 'dissertativa' && questao.resposta) {
            conteudo += `
                <div class="mb-3">
                    <h6>Resposta Esperada:</h6>
                    <p>${questao.resposta}</p>
                </div>
            `;
        }
        
        // Informações adicionais
        conteudo += `
            <div class="mt-4 pt-3 border-top">
                <small class="text-muted">
                    Criado por: ${questao.usuarioNome || 'Usuário'} | 
                    Data: ${questoesUtils.formatarData(questao.dataCriacao)}
                </small>
            </div>
        `;
        
        // Atualizar conteúdo do modal
        visualizarQuestaoConteudo.innerHTML = conteudo;
        
        // Abrir modal
        visualizarQuestaoModal.show();
    }
    
    // Atualizar contador de questões selecionadas
    function atualizarContadorSelecionadas() {
        const count = questoesSelecionadas.size;
        questoesSelecionadasCount.textContent = `${count} ${count === 1 ? 'questão selecionada' : 'questões selecionadas'}`;
        
        // Habilitar ou desabilitar botão de gerar PDF
        btnGerarPDF.disabled = count === 0;
    }
    
    // Atualizar estado do checkbox "selecionar todas"
    function atualizarSelecaoTodas() {
        const checkboxes = document.querySelectorAll('.questao-checkbox');
        
        if (checkboxes.length === 0) {
            selecionarTodas.checked = false;
            selecionarTodas.indeterminate = false;
            return;
        }
        
        const totalSelecionadas = Array.from(checkboxes).filter(cb => cb.checked).length;
        
        if (totalSelecionadas === 0) {
            selecionarTodas.checked = false;
            selecionarTodas.indeterminate = false;
        } else if (totalSelecionadas === checkboxes.length) {
            selecionarTodas.checked = true;
            selecionarTodas.indeterminate = false;
        } else {
            selecionarTodas.checked = false;
            selecionarTodas.indeterminate = true;
        }
    }
    
    // Selecionar ou desselecionar todas as questões da página atual
    function toggleSelecionarTodas() {
        const checkboxes = document.querySelectorAll('.questao-checkbox');
        const selecionar = selecionarTodas.checked;
        
        checkboxes.forEach(checkbox => {
            const questaoId = checkbox.dataset.id;
            const index = parseInt(checkbox.dataset.index);
            const questao = questoesAtuais[index];
            const row = checkbox.closest('tr');
            
            checkbox.checked = selecionar;
            
            if (selecionar) {
                questoesSelecionadas.add(questaoId);
                row.classList.add('table-primary');
            } else {
                questoesSelecionadas.delete(questaoId);
                row.classList.remove('table-primary');
            }
        });
        
        // Atualizar contador
        atualizarContadorSelecionadas();
    }
    
    // Gerar PDF com as questões selecionadas
    async function gerarPDF() {
        try {
            // Verificar se há questões selecionadas
            if (questoesSelecionadas.size === 0) {
                showToast('Selecione pelo menos uma questão para gerar o PDF', 'warning');
                return;
            }
            
            // Obter questões selecionadas
            const questoesSelecionadasArray = questoesAtuais.filter(q => questoesSelecionadas.has(q.id));
            
            // Obter opções de impressão
            const opcoes = {
                titulo: tituloImpressao.value || 'Lista de Questões',
                subtitulo: subtituloImpressao.value || '',
                mostrarRespostas: mostrarRespostas.checked,
                nomeArquivo: 'questoes.pdf'
            };
            
            // Desabilitar botão
            btnGerarPDF.disabled = true;
            btnGerarPDF.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Gerando PDF...';
            
            // Gerar PDF
            const resultado = await questoesUtils.gerarPDF(questoesSelecionadasArray, opcoes);
            
            // Reabilitar botão
            btnGerarPDF.disabled = questoesSelecionadas.size === 0;
            btnGerarPDF.innerHTML = '<i class="fas fa-file-pdf me-1"></i> Gerar PDF';
            
            if (resultado.sucesso) {
                showToast('PDF gerado com sucesso', 'success');
            } else {
                showToast('Erro ao gerar PDF: ' + resultado.mensagem, 'danger');
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            showToast('Erro ao gerar PDF', 'danger');
            
            // Reabilitar botão
            btnGerarPDF.disabled = questoesSelecionadas.size === 0;
            btnGerarPDF.innerHTML = '<i class="fas fa-file-pdf me-1"></i> Gerar PDF';
        }
    }
    
    // Event listeners
    
    // Filtros
    btnAplicarFiltros.addEventListener('click', () => {
        paginaAtual = 1;
        questoesSelecionadas.clear();
        carregarQuestoes();
    });
    
    btnLimparFiltros.addEventListener('click', () => {
        filtroMateria.value = 'todas';
        filtroAssunto.value = 'todos';
        filtroTipo.value = 'todos';
        filtroOrdenacao.value = 'dataCriacao_desc';
        filtroApenasMinhas.checked = false;
        paginaAtual = 1;
        questoesSelecionadas.clear();
        carregarQuestoes();
    });
    
    // Selecionar todas
    selecionarTodas.addEventListener('change', toggleSelecionarTodas);
    
    // Gerar PDF
    btnGerarPDF.addEventListener('click', gerarPDF);
});
