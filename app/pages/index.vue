<script setup>
import trilhaDois from '../content/trilha2.json';
import trilhaUm from '../content/trilha1.json';
import trilhaTres from '../content/trilha3.json';
import projetoData from '../content/projetos.json';
import { ref, computed, watch } from 'vue';
import municipiosCeara from '../content/municipios.json';
import ScoreboardSection from '../components/ScoreboardSection.vue';
import ScoreBoard from '../components/ScoreBoard.vue';
import ODSSimulator from '../components/ODSSimulator.vue';
import MissionHistory from '../components/MissionHistory.vue';
const mostrarSugestoes = ref(false);
const config = useRuntimeConfig();
const { userData } = useUser();
// Filtra a lista baseada no que o utilizador escreve
const sugestoesFiltradas = computed(() => {
    const busca = userData.value.municipio.toLowerCase().trim();
    if (busca.length < 2) return [];
    return municipiosCeara.filter(m =>
        m.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
            busca.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        )
    ).slice(0, 5); // Mostra apenas as 5 primeiras para não tapar o ecrã
});

const abrirQuizProjetos = () => {
    selectedTrilha.value = null;
    prepararEIniciarQuiz(projetoData);
};
const progressoTotal = ref(0); // Ex: percentagem de quizzes concluídos

const carregarSessao = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        const { data: perfil } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (perfil) {
            userData.value = {
                user_id: session.user.id,
                username: perfil.username,
                nome: perfil.nome,
                municipio: perfil.municipio
            };

            // Se estiver na tela inicial de registro, pula para as trilhas
            if (step.value === 'register') {
                step.value = 'trilhas';
            }

            // Calcular progresso (Exemplo simples baseado em registros no banco)
            const { count } = await supabase
                .from('respostas_quizzes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id);

            progressoTotal.value = Math.min((count / 10) * 100, 100); // Ex: 10 quizzes para 100%
        }
    }
};
const selecionarMunicipio = (nome) => {
    userData.value.municipio = nome;
    mostrarSugestoes.value = false;
};
const supabase = useSupabaseClient();
// Dados Organizados por Trilha
const todasAsTrilhas = [
    { id: 1, nome: "Trilha 1: Competências Socioemocionais", status: "Disponível", icon: "🧠", aulas: trilhaUm.aulas },
    {
        id: 2,
        nome: "Trilha 2: Cidadania e Participação",
        status: "Disponível",
        icon: "🌍",
        aulas: trilhaDois.aulas
    },
    { id: 3, nome: "Trilha 3: Empreendedorismo e Inovação", status: "Disponível", icon: "💡", aulas: trilhaTres.aulas }
];
// 4. Estados Reativos de Navegação e Dados
const step = ref('trilha-selection');
const selectedTrilha = ref(null);
const currentQuiz = ref(null);
// 5. Estados Reativos do Quiz
const currentIndex = ref(0);
const score = ref(0);
const selectedOption = ref(null);
const isAnswered = ref(false);

const jaRespondeu = ref(false);
const carregandoVerificacao = ref(false);

// 1. Escolhe a Trilha e vai para a lista de aulas
const escolherTrilha = (trilha) => {
    if (trilha.aulas.length === 0) return alert("Em breve!");
    selectedTrilha.value = trilha;
    step.value = 'home';
};

// Função Utilitária para embaralhar qualquer array (Fisher-Yates Shuffle)
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// 2. FUNÇÃO CORE: Prepara qualquer quiz (Trilha ou Projetos)
const prepararEIniciarQuiz = (quizData) => {
    // Deep clone para não sujar o JSON original
    const quizClone = JSON.parse(JSON.stringify(quizData));

    // Shuffle das opções de cada pergunta
    quizClone.questions.forEach(pergunta => {
        pergunta.options = shuffleArray(pergunta.options);
    });

    // Reset de estados globais do quiz
    currentQuiz.value = quizClone;
    currentIndex.value = 0;
    score.value = 0;
    isAnswered.value = false;
    selectedOption.value = null;
    jaRespondeu.value = false; // Reset da trava de duplicidade para nova checagem

    // Encaminha para o registro/identificação
    step.value = 'register';
};

const selectAula = (aula) => {
    prepararEIniciarQuiz(aula);
};

// 3. Valida o registro e inicia o quiz
const startQuiz = async () => {
    // 1. Limpeza rigorosa
    const usernameLimpo = userData.value.username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    const emailSintetico = `${usernameLimpo}@aluno.cearadevalores.com.br`;

    if (!usernameLimpo || !userData.value.senha) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }

    try {
        // TENTATIVA 1: Tentar Login Direto
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: emailSintetico,
            password: userData.value.senha
        });

        if (!signInError && signInData.user) {
            // Usuário logou com sucesso. Agora verificamos se ele tem perfil.
            const { data: perfil } = await supabase
                .from('perfis')
                .select('id')
                .eq('id', signInData.user.id)
                .single();

            // Se logou mas não tem perfil (erro de cadastro anterior), cria agora
            if (!perfil) {
                await supabase.from('perfis').insert({
                    id: signInData.user.id,
                    username: usernameLimpo,
                    nome: userData.value.nome,
                    municipio: userData.value.municipio
                });
            }

            userData.value.user_id = signInData.user.id;
            step.value = 'quiz';
            return; // Sucesso absoluto
        }

        // TENTATIVA 2: Se o login falhou porque o usuário NÃO existe, tentamos Cadastro
        // O erro de "Invalid login credentials" acontece se o usuário não existe ou senha errada.
        // Se o erro NÃO for de credenciais inválidas, tentamos o SignUp.

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: emailSintetico,
            password: userData.value.senha,
        });

        if (signUpError) {
            if (signUpError.message.includes("already registered")) {
                throw new Error("Este username já está em uso por outro aluno ou a senha está incorreta.");
            }
            throw signUpError;
        }

        if (signUpData.user) {
            // Criar o perfil imediatamente após o cadastro
            const { error: perfilError } = await supabase.from('perfis').insert({
                id: signUpData.user.id,
                username: usernameLimpo,
                nome: userData.value.nome,
                municipio: userData.value.municipio
            });

            if (perfilError) throw perfilError;

            userData.value.user_id = signUpData.user.id;
            step.value = 'quiz';
        }

    } catch (err) {
        console.error("Erro detalhado:", err);
        alert(err.message || "Erro ao acessar o sistema.");
    }
};

// Lógica do botão Voltar refinada
const goBack = () => {
    if (step.value === 'home') {
        step.value = 'trilha-selection';
    } else if (step.value === 'register') {
        // Se for projeto, volta para a seleção de trilhas. Se for aula, volta para a lista de aulas.
        if (currentQuiz.value?.id === 99) {
            step.value = 'trilha-selection';
        } else {
            step.value = 'home';
        }
    } else if (step.value === 'quiz') {
        if (confirm("Deseja mesmo sair?")) step.value = 'home';
    } else if (step.value === 'results') {
        step.value = 'trilha-selection';
    }
};
// --- FUNÇÕES DE LÓGICA DO QUIZ ---

const handleAnswer = (option) => {
    if (isAnswered.value) return;
    selectedOption.value = option; // Armazena a referência exata do objeto clicado
    isAnswered.value = true;
    if (option.isCorrect) score.value++;
};
const nextQuestion = () => {
    if (currentIndex.value + 1 < currentQuiz.value.questions.length) {
        currentIndex.value++;
        selectedOption.value = null;
        isAnswered.value = false;
    } else {
        finishAndSave();
    }
};

// --- INTEGRAÇÃO COM SUPABASE ---

const finishAndSave = async () => {
    step.value = 'saving';
    try {
        const { error } = await supabase
            .from('respostas_quizzes')
            .insert([
                {
                    user_id: userData.value.user_id, // Nova chave de ligação 
                    nome: userData.value.nome,
                    municipio: userData.value.municipio,
                    trilha_id: selectedTrilha.value.id,
                    aula_id: currentQuiz.value.id,
                    aula_titulo: currentQuiz.value.titulo,
                    pontuacao: score.value,
                    total_questoes: currentQuiz.value.questions.length
                }
            ]);

        if (error) throw error;
        step.value = 'results';
    } catch (err) {
        console.error(err.message);
        step.value = 'results';
    }
};
// Estados adicionais
const cpfError = ref('');

// Função para validar a lógica do CPF (Algoritmo oficial)
const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;

    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;

    return true;
};

// Máscara reativa para o campo
watch(() => userData.value.cpf, (newValue) => {
    if (!newValue) return;

    // Remove tudo que não é número
    let v = newValue.replace(/\D/g, '');

    // Aplica a máscara
    if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    userData.value.cpf = v;

    // Limpa o erro enquanto digita
    if (v.length < 14) {
        cpfError.value = '';
    } else {
        cpfError.value = validarCPF(v) ? '' : 'CPF Inválido';
    }
});
const linkPDFProjetos = "/arquivos/orientacoes-projetos.pdf"; // Substitua pelo link real

const resultadoFinal = computed(() => {
    const percentual = (score.value / currentQuiz.value.questions.length) * 100;
    const isProjeto = currentQuiz.value.id === 99;

    // Lógica Especial para Projetos (ID 99)
    if (isProjeto && percentual < 75) {
        return {
            titulo: "Atenção aos Detalhes! 🧐",
            mensagem: `Oi, ${userData.value.nome}! Para submeter seu projeto com segurança, é vital conhecer todas as regras. Sua pontuação foi de ${percentual.toFixed(0)}%, o que é um pouco baixo. Recomendo baixar o PDF abaixo, dar uma lida e tentar o quiz de novo!`,
            cor: "text-red-600",
            icon: "📑",
            badge: "Revisão Necessária",
            showPDF: true
        };
    }

    // Lógica padrão para Trilhas (ou Projetos com sucesso)
    if (percentual === 100) {
        return {
            titulo: "Maluco, tu é brabo!",
            mensagem: "Acertou tudo! Você provou que conhece nossos valores como ninguém.",
            cor: "text-orange-600",
            icon: "🏆",
            badge: "Protagonista Diamante",
            showPDF: isProjeto // Mostra o PDF mesmo se acertar tudo em projetos
        };
    } else if (percentual >= 70) {
        return {
            titulo: "Mandou bem demais!",
            mensagem: "Sua caminhada na trilha está sendo brilhante. Continue assim!",
            cor: "text-blue-600",
            icon: "🌟",
            badge: "Cidadão Consciente",
            showPDF: isProjeto
        };
    } else {
        return {
            titulo: "Valeu o aprendizado!",
            mensagem: "O caminho se faz caminhando. Que tal revisar o conteúdo e tentar outra vez?",
            cor: "text-slate-600",
            icon: "🌱",
            badge: "Aprendiz de Valores",
            showPDF: isProjeto
        };
    }
});
const compartilharResultado = () => {
    const texto = `🔥 Acabei de concluir a revisão da Aula ${currentQuiz.value.id} do Ceará de Valores! \n\n🎯 Acertei ${score.value} de ${currentQuiz.value.questions.length} questões. \n\n🚀 Sou um ${resultadoFinal.value.badge}! Vem testar seus conhecimentos também: ${window.location.href}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
};
const verificarRespostaExistente = async () => {
    if (!currentQuiz.value) return;

    carregandoVerificacao.value = true;

    try {
        // Lógica resiliente: se não houver trilha (caso de Projetos), ID é 99
        const trilhaId = selectedTrilha.value ? selectedTrilha.value.id : 99;

        const { data, error } = await supabase
            .from('respostas_quizzes')
            .select('pontuacao')
            .eq('user_i', userData.value.user_id)
            .eq('trilha_id', trilhaId)
            .eq('aula_id', currentQuiz.value.id)
            .maybeSingle();

        if (error) throw error;
        jaRespondeu.value = !!data;

    } catch (err) {
        console.error("Erro na verificação:", err.message);
    } finally {
        carregandoVerificacao.value = false;
    }
};

// Dispara a verificação quando o CPF termina de ser digitado
watch(() => userData.value.user_id, (val) => {
    if (val.length === 14) verificarRespostaExistente();
});
// Adicione ao seu script setup no app.vue ou index.vue
onMounted(async () => {
    carregarSessao();

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        const user = session.user;

        // 1. Busca os dados do perfil desse usuário
        const { data: perfil } = await supabase
            .from('perfis')
            .select('username, nome, municipio')
            .eq('id', user.id)
            .single();

        if (perfil) {
            // 2. Preenche o estado global para "lembrar" do aluno
            userData.value = {
                user_id: user.id,
                username: perfil.username,
                nome: perfil.nome,
                municipio: perfil.municipio
            };

            // 3. Se ele já está logado, podemos pular a tela de registro
            // e levá-lo direto para a seleção de trilhas
            if (step.value === 'register') {
                step.value = 'trilhas';
            }
        }
    }
});

const confirmarLogout = async () => {
    if (confirm("Desejas sair da tua conta?")) {
        await supabase.auth.signOut();
        userData.value = { nome: '', municipio: '', username: '', senha: '', user_id: '' };
        step.value = 'register';
        window.location.reload();
    }
};
</script>

<template>

    <div v-if="config.public.maintenanceMode == 'false'" class="min-h-screen bg-slate-50 font-sans">
        <header class="bg-blue-700 text-white p-4 sticky top-0 z-50 shadow-md">
            <div class="max-w-2xl mx-auto flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <img
src="https://cearadevalores.com.br/wp-content/uploads/2025/09/cropped-estrela-e1756834379223-32x32.png"
                        class="w-6 h-6">
                    <h1 class="font-bold">Ceará de Valores</h1>
                </div>
                <div v-if="userData.user_id" class="max-w-4xl mx-auto flex justify-between items-center">

                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100 border-2 border-white">
                            👤
                        </div>
                        <div class="mr-3">
                            <p class="text-[9px] font-black text-white uppercase tracking-tighter leading-none">
                                Explorador(a)</p>
                            <h2 class="text-xs font-black text-white uppercase italic">@{{ userData.username }}</h2>
                        </div>
                    </div>

                    <div class="flex flex-col items-center gap-1">
                        <div class="mr-3 flex justify-between w-24 text-[8px] font-black text-white uppercase">
                            <span>Progresso</span>
                            <span>{{ progressoTotal }}%</span>
                        </div>
                        <div class="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
class="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                :style="{ width: `${progressoTotal}%` }"/>
                        </div>
                    </div>

                    <div class="text-right hidden sm:block">
                        <span class="text-[10px] font-black text-white uppercase block leading-none">Município</span>
                        <span class="text-[10px] font-black text-blue uppercase italic">{{ userData.municipio }}</span>
                    </div>
                </div>
                <button
v-if="step !== 'trilha-selection'" class="text-md bg-blue-800 px-3 py-1 rounded-lg"
                    @click="goBack">
                    ← Voltar
                </button>
            </div>
        </header>

        <main class="max-w-2xl mx-auto p-4">

            <div v-if="step === 'trilha-selection'" class="space-y-6">
                <div class="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden shadow-lg mb-8">
                    <img
src="/imagens/banner_home.png" class="w-full h-full object-cover object-[center_8%]"
                        alt="Ceará de Valores">
                    <div class="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                </div>

                <a
href="https://academy.centec.org.br" target="_blank"
                    class="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl text-blue-700 text-md font-bold hover:bg-blue-50 hover:border-blue-200 transition-all">
                    <span>📖</span>
                    <span>Acessar a plataforma</span>
                </a>
                <a
href="https://wa.me/5585997653319?text=Olá" target="_blank"
                    class="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl text-blue-700 text-md font-bold hover:bg-blue-50 hover:border-blue-200 transition-all">
                    <svg
xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path
                            d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
                    </svg>
                    <span>Falar com o tutor. Precisa de ajuda?</span>
                </a>
                <div class="text-center py-4">
                    <h2 class="text-2xl font-black text-blue-900">Revisão de Trilhas</h2>
                    <p class="text-slate-500">Selecione uma trilha para começar</p>
                </div>
                <div class="grid gap-4">
                    <button
v-for="trilha in todasAsTrilhas" :key="trilha.id"
                        class="p-6 bg-white rounded-2xl shadow-sm border-2 text-left flex items-center gap-4 transition-all"
                        :class="trilha.aulas.length > 0 ? 'border-transparent hover:border-blue-500' : 'opacity-50 cursor-not-allowed'"
                        @click="escolherTrilha(trilha)">
                        <span class="text-4xl">{{ trilha.icon }}</span>
                        <div>
                            <h3 class="font-bold text-lg">{{ trilha.nome }}</h3>
                            <p class="text-xs uppercase font-bold text-blue-500">{{ trilha.status }}</p>
                        </div>
                    </button>
                </div>
                <section class="space-y-4">
                    <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Trilhas de Formação
                    </h2>
                    <div class="grid gap-4" />
                </section>

                <section class="space-y-4">
                    <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Módulo Especial</h2>
                    <button
                        class="w-full relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-2xl shadow-xl border-b-4 border-blue-950 flex items-center gap-5 group transition-all active:scale-[0.98]"
                        @click="abrirQuizProjetos">
                        <div class="bg-white/10 p-4 rounded-xl text-4xl group-hover:rotate-12 transition-transform">
                            🚀
                        </div>
                        <div class="text-left">
                            <h3 class="font-black text-white text-xl">Guia de Projetos</h3>
                            <p class="text-blue-200 text-xs leading-tight mt-1">
                                Aprenda a submeter sua ideia e concorrer a fomentos de até R$ 15 mil.
                            </p>
                        </div>
                        <div
                            class="absolute right-0 top-0 bg-yellow-400 text-blue-900 text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-md">
                            DICAS DE OURO
                        </div>
                    </button>
                    <a
href="/arquivos/orientacoes-projetos.pdf" target="_blank"
                        class="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl text-blue-700 text-md font-bold hover:bg-blue-50 hover:border-blue-200 transition-all">
                        <span>📖</span>
                        <span>Ler PDF de Orientações sobre projetos antes de começar</span>
                    </a>
                    <div class="mt-12 mb-8">
                        <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">
                            🏆 Ranking de Municípios
                        </h2>
                        <ScoreboardSection />
                        <br>
                        <ScoreBoard />
                        <ODSSimulator />
                        <MissionHistory />
                    </div>
                </section>
            </div>

            <div v-else-if="step === 'home'" class="space-y-4">
                <div class="w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-4 relative">
                    <img :src="`/imagens/banner_trilha_${selectedTrilha.id}.png`" class="w-full h-full">
                </div>
                <h2 class="font-black text-xl text-slate-800 flex items-center gap-2">
                    <span v-if="step === 'quiz'" class="text-xs bg-blue-600 px-2 py-1 rounded">
                        {{ selectedTrilha?.icon || '🚀' }} | {{ userData.nome }}
                    </span>
                </h2>
                <div class="grid gap-3">
                    <button
v-for="aula in selectedTrilha.aulas" :key="aula.id"
                        class="p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group"
                        @click="selectAula(aula)">
                        <span class="font-bold text-slate-700">Aula {{ aula.id }}: {{ aula.titulo }}</span>
                        <span class="text-blue-500 group-hover:translate-x-1 transition-transform">➔</span>
                    </button>
                </div>
            </div>

            <div v-else-if="step === 'register'" class="bg-white p-8 rounded-3xl shadow-2xl border border-blue-50">
                <div class="text-center mb-6">
                    <span
                        class="bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-xs font-black uppercase">Falta
                        pouco!</span>
                    <h2 class="text-2xl font-black text-slate-800 mt-2">Só mais um detalhe...</h2>
                    <p class="text-slate-500 text-sm">A aula selecionada é: <br><strong class="text-blue-600">{{
                        currentQuiz.titulo }}</strong></p>
                </div>

                <div class="space-y-4">
                    <h2 class="text-xl font-black text-blue-900 uppercase italic">Identificação</h2>

                    <p
                        class="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-4">
                        Já participou antes? Não precisa cadastrar de novo! <br>
                        <span class="text-blue-500">Basta usar seu username e senha acima para entrar.</span>
                    </p>
                    <div class="space-y-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Teu Nome</label>
                        <input
v-model="userData.nome" type="text" placeholder="Como queres ser chamado?"
                            class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-blue-900">
                    </div>

                    <div class="space-y-1 relative">
                        <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Teu Município</label>
                        <input
v-model="userData.municipio" type="text" placeholder="Ex: Iguatu"
                            class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-blue-900"
                            @focus="mostrarSugestoes = true">
                        <ul
v-if="mostrarSugestoes && sugestoesFiltradas.length > 0"
                            class="absolute z-10 w-full bg-white border-2 border-slate-100 rounded-2xl mt-1 shadow-xl max-h-40 overflow-y-auto">
                            <li
v-for="m in sugestoesFiltradas" :key="m"
                                class="p-3 hover:bg-blue-50 cursor-pointer font-bold text-slate-600 text-sm border-b last:border-0"
                                @click="selecionarMunicipio(m)">
                                {{ m }}
                            </li>
                        </ul>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Username Único</label>
                            <input
v-model="userData.username" type="text" placeholder="joao_maker"
                                class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-blue-900">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Senha</label>
                            <input
v-model="userData.senha" type="password" placeholder="****"
                                class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-blue-900">
                        </div>
                    </div>
                    <button
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] shadow-lg shadow-blue-200 transition-all active:scale-95"
                        @click="startQuiz">
                        ENTRAR E COMEÇAR
                    </button>
                </div>
            </div>
            <div v-else-if="step === 'quiz' && currentQuiz" class="space-y-6">

                <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest">Progresso</span>
                        <span class="text-xs font-bold text-slate-400">
                            {{ currentIndex + 1 }} de {{ currentQuiz.questions.length }}
                        </span>
                    </div>
                    <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
class="bg-blue-600 h-full transition-all duration-500 ease-out"
                            :style="{ width: ((currentIndex + 1) / currentQuiz.questions.length) * 100 + '%' }" />
                    </div>
                </div>

                <div class="bg-white p-6 rounded-3xl shadow-xl border border-slate-50">
                    <h3 class="text-lg font-bold text-slate-800 leading-tight mb-8">
                        {{ currentQuiz.questions[currentIndex].text }}
                    </h3>

                    <div class="space-y-3">
                        <button
v-for="(opt, idx) in currentQuiz.questions[currentIndex].options" :key="idx"
                            :disabled="isAnswered"
                            class="w-full p-4 rounded-2xl text-left border-2 transition-all duration-200 flex justify-between items-center group"
                            :class="{
                                // Estado normal (antes de responder)
                                'border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-white': !isAnswered,

                                // Se acertou (mostra o verde na opção correta)
                                'border-green-500 bg-green-50 text-green-800 font-bold': isAnswered && opt.isCorrect,

                                // Se errou (mostra o vermelho APENAS na opção que o usuário clicou)
                                'border-red-500 bg-red-50 text-red-800': isAnswered && selectedOption === opt && !opt.isCorrect,

                                // Opções incorretas que não foram clicadas (ficam foscas)
                                'border-slate-50 opacity-50': isAnswered && !opt.isCorrect && selectedOption !== opt
                            }" @click="handleAnswer(opt)">
                            <div class="flex items-center">
                                <span
                                    class="w-6 h-6 flex items-center justify-center rounded-full bg-white/50 text-[10px] font-black mr-3 border border-slate-200">
                                    {{ String.fromCharCode(65 + idx) }}
                                </span>
                                <span class="text-sm pr-4">{{ opt.text }}</span>
                            </div>

                            <div v-if="isAnswered">
                                <span v-if="opt.isCorrect" class="text-green-600 text-xl font-bold">✔</span>
                                <span
v-else-if="selectedOption === opt && !opt.isCorrect"
                                    class="text-red-600 text-xl font-bold">✖</span>
                            </div>
                        </button>
                    </div>

                    <div
v-if="isAnswered"
                        class="mt-8 p-5 bg-blue-50 rounded-2xl border-l-4 border-blue-500 animate-in fade-in slide-in-from-bottom-2">
                        <p class="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">💡 Por que esta
                            resposta?</p>
                        <p class="text-sm text-blue-900 leading-relaxed italic mb-6">
                            {{ selectedOption.rationale }}
                        </p>

                        <button
                            class="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                            @click="nextQuestion">
                            {{ currentIndex + 1 < currentQuiz.questions.length ? 'PRÓXIMA QUESTÃO'
                                : 'FINALIZAR E SALVAR' }} </button>
                    </div>
                </div>
            </div>
            <div v-else-if="step === 'results'" class="animate-in zoom-in-95 duration-500">
                <div class="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">

                    <div class="bg-gradient-to-b from-blue-700 to-blue-600 p-8 text-center text-white">
                        <div class="text-6xl mb-4 animate-bounce">{{ resultadoFinal.icon }}</div>
                        <h2 class="text-3xl font-black leading-tight">{{ resultadoFinal.titulo }}</h2>
                        <div
                            class="mt-4 inline-block bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                            {{ resultadoFinal.badge }}
                        </div>
                    </div>

                    <div class="p-8 text-center">
                        <div class="flex justify-center gap-4 mb-6">
                            <div class="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                <p class="text-[10px] font-black text-slate-400 uppercase">Acertos</p>
                                <p class="text-3xl font-black text-blue-700">{{ score }}</p>
                            </div>
                            <div class="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                <p class="text-[10px] font-black text-slate-400 uppercase">Questões</p>
                                <p class="text-3xl font-black text-slate-700">{{ currentQuiz.questions.length }}</p>
                            </div>
                        </div>

                        <p class="text-slate-600 leading-relaxed mb-8">
                            {{ userData.nome }}, {{ resultadoFinal.mensagem }}
                        </p>

                        <div v-if="resultadoFinal.showPDF" class="mb-8">
                            <a
:href="linkPDFProjetos" target="_blank"
                                class="inline-flex items-center gap-3 bg-red-50 text-red-700 border-2 border-red-100 px-6 py-4 rounded-2xl font-black hover:bg-red-100 transition-all w-full justify-center">
                                <span class="text-2xl">📕</span>
                                <div class="text-left">
                                    <p class="text-xs uppercase opacity-70">Material de Estudo</p>
                                    <p>BAIXAR ORIENTAÇÕES (PDF)</p>
                                </div>
                            </a>
                            <p class="text-[10px] text-slate-400 mt-2 italic">Estude o PDF para garantir sua aprovação
                                no edital!</p>
                        </div>

                        <div class="space-y-3">
                            <button
                                class="w-full bg-green-500 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
                                @click="compartilharResultado">
                                <span>Compartilhar no Zap</span>
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path
                                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </button>

                            <button
                                class="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
                                @click="step = 'home'">
                                Revisar outras aulas
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>
