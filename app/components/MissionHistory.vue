<script setup>
const supabase = useSupabaseClient()

// Estados reativos
const cpfBusca = ref('')
const historico = ref([])
const carregando = ref(false)
const pesquisado = ref(false)

// Estados para o Modal
const isModalOpen = ref(false)
const selectedMission = ref(null)

// --- O MÉTODO DE BUSCA ---
const buscarHistorico = async () => {
  // Limpa o CPF (remove pontos e traços)
  const cleanCPF = cpfBusca.value.replace(/\D/g, '')
  
  if (cleanCPF.length < 11) {
    alert("Por favor, insira um CPF válido com 11 dígitos.")
    return
  }
  
  carregando.value = true
  pesquisado.value = true
  
  const { data, error } = await supabase
    .from('missoes_ods')
    .select('*')
    .eq('cpf', cleanCPF)
    .order('created_at', { ascending: false })

  if (!error) {
    historico.value = data
  } else {
    console.error("Erro na busca:", error.message)
  }
  
  carregando.value = false
}

// Lógica de UI
const openDetails = (mission) => {
  selectedMission.value = mission
  isModalOpen.value = true
}
</script>

<template>
  <div class="mt-12 p-8 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
    
    <div class="text-center mb-8">
      <h3 class="text-2xl font-black text-blue-900 uppercase italic">📚 Meu Histórico de Impacto</h3>
      <p class="text-slate-500 font-medium">Consulta as tuas ideias salvas pelo teu CPF</p>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 mb-10">
      <input 
        v-model="cpfBusca"
        type="text" 
        placeholder="Digita o teu CPF (apenas números)"
        class="flex-1 p-5 rounded-2xl border-2 border-white focus:border-blue-500 outline-none shadow-sm font-bold text-blue-900 transition-all" 
        @keyup.enter="buscarHistorico"
      >
      <button 
        :disabled="carregando" 
        class="px-8 py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-200"
        @click="buscarHistorico"
      >
        {{ carregando ? 'BUSCANDO...' : 'BUSCAR AGORA' }}
      </button>
    </div>

    <div v-if="historico.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
  v-for="missao in historico" :key="missao.id"
  class="group bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-blue-500 hover:shadow-2xl cursor-pointer transition-all duration-300 relative overflow-hidden"
  @click="openDetails(missao)"
>
  <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300"/>

  <div class="flex justify-between items-start mb-4">
    <span class="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase italic">
      {{ new Date(missao.created_at).toLocaleDateString('pt-BR') }}
    </span>
    <span class="text-[10px] font-black text-orange-500 uppercase tracking-widest">{{ missao.ods }}</span>
  </div>

  <h4 class="font-black text-blue-900 uppercase leading-tight group-hover:text-blue-600 transition-colors">
    {{ missao.titulo }}
  </h4>

  <div class="mt-6 flex items-center justify-between">
    <button 
      class="flex items-center gap-2 text-blue-600 font-black text-[11px] uppercase tracking-wider group-hover:gap-4 transition-all"
      @click.stop="openDetails(missao)"
    >
      <span class="bg-blue-600 text-white p-2 rounded-full group-hover:bg-orange-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </span>
      Ver missão completa
    </button>
  </div>
</div>
    </div>

    <div v-else-if="pesquisado && !carregando" class="text-center py-16 bg-white rounded-[2rem]">
      <span class="text-5xl block mb-4">🏜️</span>
      <p class="text-slate-400 font-bold uppercase tracking-wide">Ainda não criaste nenhuma missão!</p>
      <p class="text-slate-300 text-sm">Usa o simulador acima para começar a tua jornada.</p>
    </div>
  </div>
  <Transition name="modal">
  <div
v-if="isModalOpen && selectedMission" 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
    @click.self="isModalOpen = false"
  >
    <div class="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl transform transition-all border-4 border-white">
      
      <div class="bg-gradient-to-r from-blue-700 to-blue-900 p-8 text-white relative">
        <button class="absolute top-6 right-6 hover:rotate-90 transition-transform duration-300" @click="isModalOpen = false">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div class="flex flex-col gap-2">
          <span class="bg-orange-500 self-start text-[10px] font-black px-3 py-1 rounded-full uppercase italic tracking-widest shadow-lg">
            Missão Desbloqueada
          </span>
          <h2 class="text-3xl font-black uppercase italic leading-tight mt-2">
            {{ selectedMission.titulo }}
          </h2>
        </div>
      </div>

      <div class="p-8 space-y-6">
        
        <div class="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <div class="bg-blue-600 text-white p-3 rounded-xl font-black text-xl">
            {{ selectedMission.ods.split(' ')[0] }}
          </div>
          <div>
            <p class="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Objetivo de Desenvolvimento</p>
            <p class="font-bold text-blue-900 leading-tight">{{ selectedMission.ods }}</p>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">O Teu Desafio:</p>
          <p class="text-lg font-medium text-slate-700 leading-relaxed italic">
            "{{ selectedMission.desafio }}"
          </p>
        </div>

        <div class="p-5 bg-orange-50 rounded-3xl border-2 border-dashed border-orange-200">
          <p class="text-[11px] font-black text-orange-600 uppercase mb-2 tracking-widest">🤔 Provocação do Mentor:</p>
          <p class="text-sm font-bold text-slate-700">
            {{ selectedMission.provocacao }}
          </p>
        </div>

        <button 
          class="w-full py-5 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-green-100 transition-all active:scale-95 group"
          @click="shareAgain(selectedMission)"
        >
          <span class="text-xl group-hover:animate-bounce">📱</span>
          COMPARTILHAR NO WHATSAPP
        </button>
      </div>
    </div>
  </div>
</Transition>
</template>
<style scoped>
/* Transição do Modal */
.modal-enter-active, .modal-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* Garante que o body não role quando o modal estiver aberto */
.modal-open {
  overflow: hidden;
}
</style>