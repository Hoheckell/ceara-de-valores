<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close"></div>

      <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-slide-up">
        
        <div class="bg-blue-700 p-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 class="text-xl font-bold flex items-center gap-2">
              📅 Agenda do Explorador
            </h2>
            <p class="text-blue-200 text-xs mt-1">Fique ligado nos prazos e eventos!</p>
          </div>
          <button @click="close" class="bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>

        <div class="p-4 overflow-y-auto flex-1 bg-slate-50">
          
          <div v-if="loading" class="flex flex-col items-center justify-center py-10 text-slate-400">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p class="text-xs">Carregando eventos...</p>
          </div>

          <div v-else-if="eventos.length === 0" class="text-center py-10 text-slate-500">
            <span class="text-4xl block mb-2">🎉</span>
            <p class="font-bold text-gray-700">Tudo tranquilo!</p>
            <p class="text-xs">Nenhum evento agendado para os próximos dias.</p>
          </div>

          <div v-else class="space-y-3">
            <div v-for="evento in eventos" :key="evento.id" 
                 class="relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex gap-4 items-start group">
              
              <div class="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
                <span class="text-[10px] uppercase font-bold text-red-500">{{ getMonth(evento.data_evento) }}</span>
                <span class="text-xl font-black leading-none">{{ getDay(evento.data_evento) }}</span>
              </div>

              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span :class="getTypeStyle(evento.tipo)" class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                    {{ getTypeLabel(evento.tipo) }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-medium">
                    {{ getTime(evento.data_evento) }}
                  </span>
                </div>

                <h3 class="text-sm font-bold text-slate-800 leading-tight mb-1">
                  {{ evento.titulo }}
                </h3>
                <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {{ evento.descricao }}
                </p>

                <a v-if="evento.link_acao" :href="evento.link_acao" target="_blank"
                   class="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline">
                  Acessar agora ➜
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="p-3 bg-slate-100 border-t border-slate-200 text-center text-[10px] text-slate-400 shrink-0">
          Horário de Brasília (GMT-3)
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);
const client = useSupabaseClient();

const eventos = ref([]);
const loading = ref(false);

// Função para buscar dados
const fetchEventos = async () => {
  loading.value = true;
  try {
    const hoje = new Date();
    const ontem = new Date(hoje.setDate(hoje.getDate()-1));
    const { data, error } = await client
      .from('eventos_ceara_valores')
      .select('*')
      .gte('data_evento', ontem.toISOString()) // Apenas eventos futuros ou de hoje
      .order('data_evento', { ascending: true }); // Mais próximos primeiro

    if (error) throw error;
    eventos.value = data || [];
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
  } finally {
    loading.value = false;
  }
};

// Busca sempre que a modal abrir
watch(() => props.isOpen, (newVal) => {
  if (newVal) fetchEventos();
});

const close = () => {
  emit('close');
};

// --- Helpers de Formatação ---

const getMonth = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
};

const getDay = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit' });
};

const getTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + 'h';
};

// --- Estilos por Tipo ---
const getTypeStyle = (tipo) => {
  const map = {
    'live': 'bg-red-100 text-red-600',
    'prazo': 'bg-orange-100 text-orange-600',
    'quiz': 'bg-purple-100 text-purple-600',
    'aviso': 'bg-blue-100 text-blue-600'
  };
  return map[tipo] || 'bg-gray-100 text-gray-600';
};

const getTypeLabel = (tipo) => {
  const map = {
    'live': '🔴 Ao Vivo',
    'prazo': '⚠️ Prazo Final',
    'quiz': '📝 Novo Quiz',
    'aviso': 'ℹ️ Aviso'
  };
  return map[tipo] || 'Evento';
};
</script>

<style scoped>
/* Animação de entrada */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>