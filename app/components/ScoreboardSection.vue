<script setup>
const supabase = useSupabaseClient(); // Ou como você estiver instanciando o Supabase
const leaderboardData = ref([]);
const carregandoRanking = ref(true);
const infoMunicipioOpen = ref(false);
const fetchRanking = async () => {
    carregandoRanking.value = true;
    try {
        const { data, error } = await supabase
            .from('ranking_municipios') // Nome da view que criamos
            .select('municipio, total_pontos')
            .order('total_pontos', { ascending: false });

        if (error) throw error;

        // Mapeamos os dados para o formato que o nosso gráfico espera
        leaderboardData.value = data.map(item => ({
            nome: item.municipio,
            total: item.total_pontos
        }));
    } catch (err) {
        console.error("Erro ao carregar ranking:", err.message);
    } finally {
        carregandoRanking.value = false;
    }
};

// Carrega os dados quando o componente é montado
onMounted(() => {
    fetchRanking();
});

// Lógica de cálculo (mantida do design anterior)
const sortedData = computed(() => leaderboardData.value);
const maxTotal = computed(() => {
    return Math.max(...sortedData.value.map(item => item.total)) || 1;
});

// Funções de ícone e cor (mantidas do design anterior)
const getRankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
};

const getMediaColorClass = (media) => {
    if (media >= 8) return 'bg-green-100 text-green-700 border-green-200';
    if (media >= 6) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-orange-100 text-orange-700 border-orange-200';
};
</script>

<template>
    <Transition name="fade">
        <div
v-if="infoMunicipioOpen"
            class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm"
            @click.self="infoMunicipioOpen = false">
            <div class="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border-4 border-blue-50 relative">
                <button
class="absolute top-6 right-6 text-slate-300 hover:text-blue-600 font-black"
                    @click="infoMunicipioOpen = false">✕</button>

                <div class="space-y-4">
                    <div
                        class="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl mb-4">
                        🏙️</div>
                    <h3 class="text-2xl font-black text-blue-900 uppercase italic">A Nossa Força Coletiva</h3>
                    <p class="text-slate-600 leading-relaxed">
                        Este gráfico mostra o esforço somado de todos os jovens da tua terra. Quando a tua cidade sobe
                        no ranking, não é apenas um aluno que vence, é a comunidade inteira que brilha!
                    </p>
                    <div class="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cálculo em Tempo
                            Real:</p>
                        <p class="text-sm font-bold text-blue-800">Σ (Pontos de todos os alunos do município)</p>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
    <section class="py-4">
        <div class="flex items-center justify-between mb-4 px-2">
            <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>📊</span> Placar das Cidades
            <button
                class="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full hover:bg-orange-500 hover:text-white transition-all animate-pulse"
                @click="infoMunicipioOpen = true">
                <span class="font-black text-xs">i</span>
            </button>
            </h2>
            <button class="text-blue-600 hover:rotate-180 transition-transform duration-500" @click="fetchRanking">
                <span v-if="!carregandoRanking">🔄</span>
            </button>
        </div>

        <div class="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 relative min-h-[200px]">

            <div
v-if="carregandoRanking"
                class="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-3xl">
                <span class="animate-spin text-4xl mb-2">⌛</span>
                <p class="text-xs font-bold text-slate-400 animate-pulse">ATUALIZANDO PLACAR...</p>
            </div>

            <div v-else-if="sortedData.length > 0" class="space-y-5">
                <div v-for="(item, index) in sortedData" :key="item.nome" class="group relative">
                    <div class="flex items-center justify-between mb-2 text-sm">
                        <div class="flex items-center gap-2 font-bold text-slate-700">
                            <span v-if="getRankIcon(index)" class="text-lg">{{ getRankIcon(index) }}</span>
                            <span v-else class="text-slate-400 text-xs w-6 text-center">#{{ index + 1 }}</span>
                            <span>{{ item.nome }}</span>
                        </div>
                        <div class="font-black text-blue-900">
                            {{ item.total }} <span class="text-[10px] text-slate-400 font-normal lowercase">part.</span>
                        </div>
                    </div>

                    <div class="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                        <div
class="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
                            :style="{ width: (item.total / maxTotal * 100) + '%' }" />
                    </div>
                </div>
            </div>

            <div v-else class="text-center py-10">
                <p class="text-slate-400 font-bold">Nenhuma participação registrada ainda. 🚀</p>
            </div>
        </div>
    </section>
</template>