<script setup>
import trilhaDois from '../content/trilha2.json';
import trilhaUm from '../content/trilha1.json';
import trilhaTres from '../content/trilha3.json';
const numQuizzes = trilhaDois.aulas.length + trilhaUm.aulas.length + trilhaTres.aulas.length;
const supabase = useSupabaseClient();
const ranking = ref([]);
const carregando = ref(true);
const infoDesempenhoOpen = ref(false);
const isModalAberto = ref(false);
const municipioFoco = ref('');
const listaAlunosModal = ref([]);
const carregandoAlunos = ref(false);

const verParticipantes = async (municipio) => {
    municipioFoco.value = municipio;
    isModalAberto.value = true;
    carregandoAlunos.value = true;

    try {
        const { data, error } = await supabase
            .from('ranking_detalhado_alunos')
            .select('nome, pontos_individuais')
            .eq('municipio', municipio.toUpperCase());

        if (error) throw error;
        listaAlunosModal.value = data;
    } catch (err) {
        console.error("Erro ao carregar detalhes:", err.message);
    } finally {
        carregandoAlunos.value = false;
    }
};

const fetchRanking = async () => {
    carregando.value = true;
    try {
        const { data, error } = await supabase
            .from('ranking_municipios_agrupado')
            .select('*');

        if (error) throw error;
        ranking.value = data;
    } catch (err) {
        console.error("Erro ao buscar dados do ranking:", err.message);
    } finally {
        carregando.value = false;
    }
};

onMounted(() => {
    fetchRanking();
});

const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    if (index > 2) return '';
    return null;
};
</script>

<template>
    <Transition name="fade">
        <div
v-if="infoDesempenhoOpen"
            class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm"
            @click.self="infoDesempenhoOpen = false">
            <div class="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border-4 border-blue-50 relative">
                <button
class="absolute top-6 right-6 text-slate-300 hover:text-blue-600 font-black"
                    @click="infoDesempenhoOpen = false">✕</button>

                <div class="space-y-4">
                    <div
                        class="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl mb-4">
                        🏙️</div>
                    <h3 class="text-2xl font-black text-blue-900 uppercase italic">A Nossa Força Coletiva</h3>
                    <p class="text-slate-600 leading-relaxed">
                        <strong>🌟 Ranking de Desempenho: O Teu Protagonismo </strong><br>Aqui celebramos os
                        Desbravadores — aqueles que
                        mergulharam fundo nas trilhas, demonstrando consistência e domínio dos temas. O que ele
                        representa? A tua jornada pessoal de excelência. Ele destaca os alunos que mais se dedicaram e
                        que alcançaram os melhores resultados nas missões e quizzes. Como é calculado? O cálculo é
                        baseado em dois pilares: Soma de Pontos: A base do teu sucesso. Consistência (Desempate): Se
                        dois
                        alunos tiverem a mesma pontuação, o critério de desempate é a quantidade de quizzes
                        concluídos.

                    </p>
                    <div class="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cálculo em Tempo
                            Real:</p>
                        <p class="text-sm font-bold text-blue-800">Performance = Total de Pontos + (Fator de
                            Consistência)</p>
                    </div>
                    <p class="text-slate-600 leading-relaxed">
                        <strong>Dica de Ouro:</strong> Não basta ser rápido, é preciso ser constante! Quem completa mais
                        trilhas ganha mais
                        destaque no nosso "Top 100".
                    </p>
                    <p class="text-slate-600 leading-relaxed">
                        🎓 <strong>Por que participar?</strong>
                        Mais do que aparecer no topo, estar aqui significa que estás a desenvolver as competências que o
                        mercado e o mundo precisam hoje: Inteligência Emocional, Criatividade Maker e Visão Sustentável.
                    </p>
                </div>
            </div>
        </div>
    </Transition>
    <Transition name="page">
        <div
v-if="isModalAberto"
            class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-md">
            <div class="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <h3 class="text-2xl font-black text-blue-900 uppercase italic leading-none">
                            Destaques de <br><span class="text-orange-500">{{ municipioFoco }}</span>
                        </h3>
                        <button class="text-slate-300 hover:text-red-500" @click="isModalAberto = false">✕</button>
                    </div>

            <div
v-if="carregandoAlunos"
                class="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-3xl">
                <span class="animate-spin text-4xl mb-2">⌛</span>
                <p class="text-xs font-bold text-slate-400 animate-pulse">ATUALIZANDO PLACAR...</p>
            </div>
                    <div class="space-y-3 max-h-96 overflow-y-auto pr-2">
                        <div
v-for="(aluno, index) in listaAlunosModal" :key="index"
                            class="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span class="font-bold text-blue-900 text-sm uppercase">{{ aluno.nome }}</span>
                            <span class="font-black text-sm text-blue-600">{{ aluno.pontos_individuais }} pts</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
    <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div class="bg-slate-50 border-b border-slate-100 p-6">
            <h3 class="font-black text-slate-800 flex items-center gap-2">
                🏆 Ranking de Desempenho<button
                    class="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full hover:bg-orange-500 hover:text-white transition-all animate-pulse"
                    @click="infoDesempenhoOpen = true">
                    <span class="font-black text-xs">i</span>
                </button>
            </h3>
        </div>
        <div class="space-y-4">
            <div
v-for="item in ranking" :key="item.municipio"
                class="bg-white border-2 border-slate-100 p-5 rounded-[2rem] flex justify-between items-center shadow-sm hover:shadow-md transition-all">

                <div class="flex items-center gap-4">
                    <div
                        class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black">
                        {{ranking.indexOf(item) + 1 }}º
                    </div>
                    <div>
                        <h4 class="font-black text-blue-900 uppercase italic leading-none">{{getMedal(ranking.indexOf(item))+  item.municipio }}</h4>
                        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">
                            {{ item.total_alunos }} Alunos Participantes
                        </p>
                    </div>
                </div>

                <button
class="bg-orange-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-colors"
                    @click="verParticipantes(item.municipio)">
                    Ver Participantes
                </button>
            </div>
        </div>

        <div v-if="!carregando" class="p-4 bg-blue-50/50 text-center">
            <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                {{ ranking[0]?.municipio }} está no topo do Ceará de Valores! 🚀
            </p>
        </div>
    </div>
</template>