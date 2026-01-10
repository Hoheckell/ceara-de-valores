<script setup>
const supabase = useSupabaseClient();
const ranking = ref([]);
const carregando = ref(true);

const fetchRanking = async () => {
    carregando.value = true;
    try {
        const { data, error } = await supabase
            .from('ranking_municipios')
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
    return null;
};
</script>

<template>
    <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div class="bg-slate-50 border-b border-slate-100 p-6">
            <h3 class="font-black text-slate-800 flex items-center gap-2">
                🏆 Ranking de Desempenho
            </h3>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr
                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th class="px-6 py-4">Posição</th>
                        <th class="px-6 py-4">Município</th>
                        <th class="px-6 py-4 text-center">Participações</th>
                        <th class="px-6 py-4 text-right">Média de Acertos</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <template v-if="carregando">
                        <tr v-for="i in 3" :key="i" class="animate-pulse">
                            <td colspan="4" class="px-6 py-4 bg-slate-50/50"/>
                        </tr>
                    </template>

                    <template v-else>
                        <tr
v-for="(item, index) in ranking" :key="item.municipio"
                            class="hover:bg-blue-50/30 transition-colors"> 
                            <td class="px-6 py-4 font-black text-slate-400">
                                <span v-if="getMedal(index)" class="text-xl">{{ getMedal(index) }}</span>
                                <span v-else>#{{ index + 1 }}</span>
                            </td>
                            <td class="px-6 py-4 font-bold text-slate-700">
                                {{ item.municipio }}
                            </td>
                            <td class="px-6 py-4 text-center">
                                <span class="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">
                                    {{ item.total_participacoes }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <span
class="font-black"
                                    :class="item.media_acertos >= 7 ? 'text-green-600' : 'text-orange-500'">
                                    {{ item.media_acertos.toFixed(1) }}
                                </span>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <div v-if="!carregando" class="p-4 bg-blue-50/50 text-center">
            <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                {{ ranking[0]?.municipio }} está no topo do Ceará de Valores! 🚀
            </p>
        </div>
    </div>
</template>