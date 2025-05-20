// Funcionalidades específicas da página de responder questões
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de responder questões
    const isResponderPage = window.location.pathname.includes('/responder.html');
    
    if (!isResponderPage) return;
    
    console.log('Página de responder questões carregada');
    
    // Referências aos elementos do DOM
    const filtroMateria = document.getElementById('filtroMateria');
    const filtroAssunto = document.getElementById('filtroAssunto');
    const filtroTipo = document.getElementById('filtroTipo');
    const btnIniciarQuestionario = document.getElementById('btnIniciarQuestionario');
    
    // Elementos do questionário
    const questionarioContainer = document.getElementById('questionarioContainer');
    const questionarioTitulo = document.getElementById('questionarioTitulo');
    const questaoAtualIndicador = document.getElementById('questaoAtualIndicador');
    const questionarioProgresso = document.getElementById('questionarioProgresso');
    const questaoAtualCard = document.getElementById('questaoAtualCard');
    const questaoMateria = document.getElementById('questaoMateria');
    const questaoEnunciado = document.getElementById('questaoEnunciado');
    const questaoImagemContainer = document.getElementById('questaoImagemContainer');
    const questaoImagem = document.getElementById('questaoImagem');
    const alternativasContainer = document.getElementById('alternativasContainer');
    const respostaContainer = document.getElementById('respostaContainer');
    const respostaDissertativa = document.getElementById('respostaDissertativa');
    const btnQuestaoAnterior = document.getElementById('btnQuestaoAnterior');
    const btnQuestaoProxima = document.getElementById('btnQuestaoProxima');
    const feedbackContainer = document.getElementById('feedbackContainer');
    const btnCancelarQuestionario = document.getElementById('btnCancelarQuestionario');
    const btnFinalizarQuestionario = document.getElementById('btnFinalizarQuestionario');
    
    // Elementos de resultados
    const resultadosContainer = document.getElementById('resultadosContainer');
    const totalQuestoes = document.getElementById('totalQuestoes');
    const totalAcertos = document.getElementById('totalAcertos');
    const totalErros = document.getElementById('totalErros');
    const progressoAcertos = document.getElementById('progressoAcertos');
    const progressoErros = document.getElementById('progressoErros');
    const btnNovoQuestionario = document.getElementById('btnNovoQuestionario');
    const btnVerDetalhes = document.getElementById('btnVerDetalhes');
    const detalhesResultados = document.getElementById('detalhesResultados');
    const accordionResultados = document.getElementById('accordionResultados');
    
    // Variáveis de estado
    let questoes = [];
    let questaoAtualIndex = 0;
    let respostas = [];
    
    // Verificar autenticação
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário autenticado, carregar dados
            carregarMateriasEAssuntos();
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
    
    // Iniciar questionário
    async function iniciarQuestionario() {
        try {
            // Obter filtros
            const filtros = {
                materia: filtroMateria.value,
                assunto: filtroAssunto.value,
                tipo: filtroTipo.value
            };
            
            // Desabilitar botão
            btnIniciarQuestionario.disabled = true;
            btnIniciarQuestionario.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Carregando...';
            
            // Buscar questões
            const resultado = await questoesUtils.buscarQuestoes(filtros);
            
            // Reabilitar botão
            btnIniciarQuestionario.disabled = false;
            btnIniciarQuestionario.innerHTML = '<i class="fas fa-play me-1"></i> Iniciar Questionário';
            
            if (resultado.sucesso && resultado.questoes.length > 0) {
                // Embaralhar questões
                questoes = embaralharArray(resultado.questoes);
                
                // Inicializar variáveis de estado
                questaoAtualIndex = 0;
                respostas = Array(questoes.length).fill(null);
                
                // Mostrar questionário
                questionarioContainer.classList.remove('d-none');
                resultadosContainer.classList.add('d-none');
                
                // Atualizar título
                let titulo = 'Questionário';
                if (filtros.materia !== 'todas') {
                    titulo += ` - ${filtros.materia}`;
                    
                    if (filtros.assunto !== 'todos') {
                        titulo += ` (${filtros.assunto})`;
                    }
                }
                questionarioTitulo.textContent = titulo;
                
                // Exibir primeira questão
                exibirQuestao(0);
                
                // Rolar para o questionário
                questionarioContainer.scrollIntoView({ behavior: 'smooth' });
            } else {
                if (resultado.questoes.length === 0) {
                    showToast('Nenhuma questão encontrada com os filtros selecionados', 'warning');
                } else {
                    showToast('Erro ao carregar questões: ' + resultado.mensagem, 'danger');
                }
            }
        } catch (error) {
            console.error('Erro ao iniciar questionário:', error);
            showToast('Erro ao iniciar questionário', 'danger');
            
            // Reabilitar botão
            btnIniciarQuestionario.disabled = false;
            btnIniciarQuestionario.innerHTML = '<i class="fas fa-play me-1"></i> Iniciar Questionário';
        }
    }
    
    // Exibir questão atual
    function exibirQuestao(index) {
        // Verificar índice
        if (index < 0 || index >= questoes.length) {
            console.error('Índice de questão inválido:', index);
            return;
        }
        
        // Atualizar índice atual
        questaoAtualIndex = index;
        
        // Obter questão atual
        const questao = questoes[index];
        
        // Atualizar indicador de progresso
        questaoAtualIndicador.textContent = `Questão ${index + 1} de ${questoes.length}`;
        const progresso = ((index + 1) / questoes.length) * 100;
        questionarioProgresso.style.width = `${progresso}%`;
        questionarioProgresso.textContent = `${Math.round(progresso)}%`;
        questionarioProgresso.setAttribute('aria-valuenow', progresso);
        
        // Atualizar informações da questão
        questaoMateria.textContent = `${questao.materia} - ${questao.assunto}`;
        questaoEnunciado.textContent = questao.enunciado;
        
        // Exibir ou ocultar imagem
        if (questao.imagemUrl) {
            questaoImagem.src = questao.imagemUrl;
            questaoImagemContainer.classList.remove('d-none');
        } else {
            questaoImagemContainer.classList.add('d-none');
        }
        
        // Exibir campos conforme o tipo de questão
        if (questao.tipo === 'multipla_escolha') {
            alternativasContainer.classList.remove('d-none');
            respostaContainer.classList.add('d-none');
            
            // Gerar alternativas
            alternativasContainer.innerHTML = '';
            
            for (let i = 0; i < questao.alternativas.length; i++) {
                const alternativa = document.createElement('div');
                alternativa.className = 'alternativa';
                
                // Verificar se esta alternativa foi selecionada anteriormente
                if (respostas[index] !== null && respostas[index].alternativa === i) {
                    alternativa.classList.add('selecionada');
                }
                
                const letra = String.fromCharCode(65 + i); // A, B, C, D, E...
                
                alternativa.innerHTML = `
                    <span class="alternativa-letra">${letra})</span>
                    <span class="alternativa-texto">${questao.alternativas[i]}</span>
                `;
                
                // Adicionar evento de clique
                alternativa.addEventListener('click', () => {
                    // Remover classe 'selecionada' de todas as alternativas
                    const todasAlternativas = alternativasContainer.querySelectorAll('.alternativa');
                    todasAlternativas.forEach(alt => alt.classList.remove('selecionada'));
                    
                    // Adicionar classe 'selecionada' à alternativa clicada
                    alternativa.classList.add('selecionada');
                    
                    // Salvar resposta
                    respostas[index] = {
                        alternativa: i,
                        correta: i === questao.alternativaCorreta
                    };
                });
                
                alternativasContainer.appendChild(alternativa);
            }
        } else {
            // Questão dissertativa
            alternativasContainer.classList.add('d-none');
            respostaContainer.classList.remove('d-none');
            
            // Verificar se já existe resposta
            if (respostas[index] !== null && respostas[index].texto) {
                respostaDissertativa.value = respostas[index].texto;
            } else {
                respostaDissertativa.value = '';
            }
            
            // Adicionar evento para salvar resposta ao digitar
            respostaDissertativa.oninput = () => {
                respostas[index] = {
                    texto: respostaDissertativa.value,
                    // Para questões dissertativas, a correção é manual
                    correta: null
                };
            };
        }
        
        // Atualizar estado dos botões de navegação
        btnQuestaoAnterior.disabled = index === 0;
        
        if (index === questoes.length - 1) {
            btnQuestaoProxima.textContent = 'Finalizar';
            btnFinalizarQuestionario.classList.remove('d-none');
        } else {
            btnQuestaoProxima.textContent = 'Próxima';
            btnFinalizarQuestionario.classList.add('d-none');
        }
        
        // Ocultar feedback
        feedbackContainer.classList.add('d-none');
    }
    
    // Navegar para a questão anterior
    function questaoAnterior() {
        if (questaoAtualIndex > 0) {
            exibirQuestao(questaoAtualIndex - 1);
        }
    }
    
    // Navegar para a próxima questão
    function questaoProxima() {
        // Verificar se é a última questão
        if (questaoAtualIndex === questoes.length - 1) {
            finalizarQuestionario();
        } else if (questaoAtualIndex < questoes.length - 1) {
            exibirQuestao(questaoAtualIndex + 1);
        }
    }
    
    // Finalizar questionário
    function finalizarQuestionario() {
        // Verificar se todas as questões foram respondidas
        const questoesNaoRespondidas = respostas.filter(r => r === null).length;
        
        if (questoesNaoRespondidas > 0) {
            // Perguntar se deseja finalizar mesmo com questões não respondidas
            if (!confirm(`Você ainda tem ${questoesNaoRespondidas} questão(ões) não respondida(s). Deseja finalizar mesmo assim?`)) {
                return;
            }
        }
        
        // Calcular resultados
        const total = questoes.length;
        let acertos = 0;
        let erros = 0;
        
        for (let i = 0; i < total; i++) {
            const resposta = respostas[i];
            const questao = questoes[i];
            
            if (resposta === null) {
                // Questão não respondida conta como erro
                erros++;
            } else if (questao.tipo === 'multipla_escolha') {
                if (resposta.correta) {
                    acertos++;
                } else {
                    erros++;
                }
            }
            // Questões dissertativas não são contabilizadas automaticamente
        }
        
        // Atualizar elementos de resultados
        totalQuestoes.textContent = total;
        totalAcertos.textContent = acertos;
        totalErros.textContent = erros;
        
        // Calcular percentuais
        const percentualAcertos = (acertos / total) * 100;
        const percentualErros = (erros / total) * 100;
        
        progressoAcertos.style.width = `${percentualAcertos}%`;
        progressoAcertos.textContent = `${Math.round(percentualAcertos)}%`;
        
        progressoErros.style.width = `${percentualErros}%`;
        progressoErros.textContent = `${Math.round(percentualErros)}%`;
        
        // Ocultar questionário e mostrar resultados
        questionarioContainer.classList.add('d-none');
        resultadosContainer.classList.remove('d-none');
        detalhesResultados.classList.add('d-none');
        
        // Gerar detalhes dos resultados
        gerarDetalhesResultados();
        
        // Rolar para os resultados
        resultadosContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Salvar resultados no Firestore
        salvarResultados(total, acertos, erros);
    }
    
    // Gerar detalhes dos resultados
    function gerarDetalhesResultados() {
        accordionResultados.innerHTML = '';
        
        for (let i = 0; i < questoes.length; i++) {
            const questao = questoes[i];
            const resposta = respostas[i];
            
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';
            
            // Determinar status da questão
            let status = 'Não respondida';
            let statusClass = 'bg-secondary';
            
            if (resposta !== null) {
                if (questao.tipo === 'multipla_escolha') {
                    if (resposta.correta) {
                        status = 'Correta';
                        statusClass = 'bg-success';
                    } else {
                        status = 'Incorreta';
                        statusClass = 'bg-danger';
                    }
                } else {
                    status = 'Respondida';
                    statusClass = 'bg-primary';
                }
            }
            
            // Criar cabeçalho do accordion
            accordionItem.innerHTML = `
                <h2 class="accordion-header" id="heading${i}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${i}" aria-expanded="false" aria-controls="collapse${i}">
                        <div class="d-flex justify-content-between align-items-center w-100">
                            <span>Questão ${i + 1}: ${questao.materia} - ${questao.assunto}</span>
                            <span class="badge ${statusClass} ms-2">${status}</span>
                        </div>
                    </button>
                </h2>
                <div id="collapse${i}" class="accordion-collapse collapse" aria-labelledby="heading${i}" data-bs-parent="#accordionResultados">
                    <div class="accordion-body">
                        <p><strong>Enunciado:</strong> ${questao.enunciado}</p>
                        
                        ${questao.imagemUrl ? `
                            <div class="text-center mb-3">
                                <img src="${questao.imagemUrl}" class="questao-imagem" alt="Imagem da questão">
                            </div>
                        ` : ''}
                        
                        ${questao.tipo === 'multipla_escolha' ? `
                            <div class="mt-3">
                                <p><strong>Alternativas:</strong></p>
                                <div class="alternativas-resultado">
                                    ${questao.alternativas.map((alt, index) => {
                                        const letra = String.fromCharCode(65 + index);
                                        let classes = 'alternativa';
                                        
                                        if (resposta !== null && resposta.alternativa === index) {
                                            classes += resposta.correta ? ' correta' : ' incorreta';
                                        } else if (index === questao.alternativaCorreta) {
                                            classes += ' correta';
                                        }
                                        
                                        return `
                                            <div class="${classes}">
                                                <span class="alternativa-letra">${letra})</span>
                                                <span class="alternativa-texto">${alt}</span>
                                                ${index === questao.alternativaCorreta ? '<span class="badge bg-success ms-2">Correta</span>' : ''}
                                                ${resposta !== null && resposta.alternativa === index && !resposta.correta ? '<span class="badge bg-danger ms-2">Sua resposta</span>' : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : `
                            <div class="mt-3">
                                <p><strong>Sua resposta:</strong></p>
                                <div class="border p-3 bg-light">
                                    ${resposta !== null && resposta.texto ? resposta.texto : '<em>Não respondida</em>'}
                                </div>
                                
                                ${questao.resposta ? `
                                    <p class="mt-3"><strong>Resposta esperada:</strong></p>
                                    <div class="border p-3 bg-light">
                                        ${questao.resposta}
                                    </div>
                                ` : ''}
                            </div>
                        `}
                    </div>
                </div>
            `;
            
            accordionResultados.appendChild(accordionItem);
        }
    }
    
    // Salvar resultados no Firestore
    async function salvarResultados(total, acertos, erros) {
        try {
            // Verificar se o usuário está autenticado
            const usuario = auth.currentUser;
            if (!usuario) {
                console.error('Usuário não autenticado');
                return;
            }
            
            // Preparar dados do resultado
            const resultado = {
                usuarioId: usuario.uid,
                usuarioNome: usuario.displayName || usuario.email,
                data: firebase.firestore.FieldValue.serverTimestamp(),
                totalQuestoes: total,
                acertos: acertos,
                erros: erros,
                percentualAcertos: (acertos / total) * 100,
                filtros: {
                    materia: filtroMateria.value,
                    assunto: filtroAssunto.value,
                    tipo: filtroTipo.value
                },
                questoes: questoes.map((q, i) => ({
                    id: q.id,
                    materia: q.materia,
                    assunto: q.assunto,
                    tipo: q.tipo,
                    resposta: respostas[i]
                }))
            };
            
            // Salvar no Firestore
            await db.collection('resultados').add(resultado);
            
            console.log('Resultados salvos com sucesso');
        } catch (error) {
            console.error('Erro ao salvar resultados:', error);
        }
    }
    
    // Cancelar questionário
    function cancelarQuestionario() {
        if (confirm('Tem certeza que deseja cancelar o questionário? Todo o progresso será perdido.')) {
            // Ocultar questionário
            questionarioContainer.classList.add('d-none');
            
            // Rolar para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    // Iniciar novo questionário
    function novoQuestionario() {
        // Ocultar resultados
        resultadosContainer.classList.add('d-none');
        
        // Rolar para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Mostrar/ocultar detalhes dos resultados
    function toggleDetalhesResultados() {
        if (detalhesResultados.classList.contains('d-none')) {
            detalhesResultados.classList.remove('d-none');
            btnVerDetalhes.innerHTML = '<i class="fas fa-eye-slash me-1"></i> Ocultar Detalhes';
        } else {
            detalhesResultados.classList.add('d-none');
            btnVerDetalhes.innerHTML = '<i class="fas fa-list me-1"></i> Ver Detalhes';
        }
    }
    
    // Função para embaralhar array (algoritmo Fisher-Yates)
    function embaralharArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    // Event listeners
    btnIniciarQuestionario.addEventListener('click', iniciarQuestionario);
    btnQuestaoAnterior.addEventListener('click', questaoAnterior);
    btnQuestaoProxima.addEventListener('click', questaoProxima);
    btnCancelarQuestionario.addEventListener('click', cancelarQuestionario);
    btnFinalizarQuestionario.addEventListener('click', finalizarQuestionario);
    btnNovoQuestionario.addEventListener('click', novoQuestionario);
    btnVerDetalhes.addEventListener('click', toggleDetalhesResultados);
});
