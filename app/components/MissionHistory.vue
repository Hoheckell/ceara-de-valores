<script setup>
const supabase = useSupabaseClient();
const userData = ref({ user_id: '',username: '', senha: '' });
const estaLogado = ref(false);
const actualSession = ref();
const carregando = ref(false);
const missoes = ref([]);
const { setUsuario } = useUser();
// Estados para o Modal
const isModalOpen = ref(false)
const selectedMission = ref(null)
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    estaLogado.value = true;
    actualSession.value = session;
    buscarHistorico(session.user.id);
  }
});
const fazerLoginHistorico = async () => {
  if (!userData.value.username || !userData.value.senha) return alert("Preenche os dados!");

  carregando.value = true;
  const emailSintetico = `${userData.value.username.toLowerCase().trim()}@aluno.cearadevalores.com.br`;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailSintetico,
      password: userData.value.senha
    });

    if (error) throw new Error("Username ou senha incorretos.");
    const { data: perfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (perfil) {
      // 🚀 AQUI A MÁGICA ACONTECE: Atualiza o estado global
      setUsuario({
        user_id: data.user.id,
        username: perfil.username,
        nome: perfil.nome,
        municipio: perfil.municipio
      });

      estaLogado.value = true;
      buscarHistorico(data.user.id);
    }
  } catch (err) {
    alert(err.message);
  } finally {
    carregando.value = false;
  }
};
// --- O MÉTODO DE BUSCA ---
// 3. Buscar os dados das missões
const buscarHistorico = async (userId) => {
  try {
    carregando.value = true;
    const { data, error } = await supabase
      .from('missoes_ods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    missoes.value = data || [];

    if (error) throw error;
  } catch (err) {
    console.error(err.message);
  } finally {
    carregando.value = false;
  }
};

// Lógica de UI
const openDetails = (mission) => {
  selectedMission.value = mission
  isModalOpen.value = true
}

watch(() => userData.value.user_id, (newId) => {
  if (newId) {
    userData.value.user_id = newId;
  }
}, { immediate: true });
</script>

<template>
  <div class="bg-white rounded-[3rem] p-8 shadow-xl border-2 border-slate-50">

    <div v-if="!estaLogado" class="text-center py-10">
      <div class="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6">🔒</div>
      <h2 class="text-2xl font-black text-blue-900 uppercase italic mb-2">Teu Diário de Missões</h2>
      <p class="text-slate-500 text-sm mb-8 px-6">Identifica-te para recuperares todas as tuas ideias e projetos salvos.
      </p>

      <div class="max-w-xs mx-auto space-y-4">
        <input
v-model="userData.username" type="text" placeholder="Teu Username"
          class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold">

        <input
v-model="userData.senha" type="password" placeholder="Tua Senha"
          class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold">

        <button
:disabled="carregando"
          class="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all"
          @click="fazerLoginHistorico">
          {{ carregando ? 'A ACEDER...' : 'VER ITEM' }}
        </button>
      </div>
    </div>

    <div v-else>
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-2xl font-black text-blue-900 uppercase italic">Minhas Missões</h2>
        <span class="bg-orange-100 text-orange-600 px-4 py-1 rounded-full font-black text-[10px] uppercase">
          {{ missoes.length }} Registos
        </span>
        <button  @click="buscarHistorico(actualSession.user.id)">
          Atualizar 🗘
        </button>
      </div>

      <div v-if="missoes.length > 0" class="grid gap-4">
        <div v-for="missao in missoes" :key="missao.id" class="p-4 border-2 border-slate-50 rounded-2xl">
          <h4 class="font-bold text-blue-900">{{ missao.titulo }}</h4>
          <p class="text-sm text-slate-500">{{ new Date(missao.created_at).toLocaleDateString() }}</p>

          <button
:disabled="carregando"
            class="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all"
            @click="openDetails(missao)">
            {{ carregando ? 'A ACEDER...' : 'VER ITEM' }}
          </button>
        </div>
      </div>

      <div v-else class="text-center py-10 text-slate-400 font-bold italic">
        Ainda não completaste nenhuma missão. Vamos começar?
      </div>
    </div>

  </div>
  <Transition name="modal">
    <div
v-if="isModalOpen && selectedMission"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
      @click.self="isModalOpen = false">
      <div
        class="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl transform transition-all border-4 border-white">

        <div class="bg-gradient-to-r from-blue-700 to-blue-900 p-8 text-white relative">
          <button
class="absolute top-6 right-6 hover:rotate-90 transition-transform duration-300"
            @click="isModalOpen = false">
            <svg
xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white/50" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="flex flex-col gap-2">
            <span
              class="bg-orange-500 self-start text-[10px] font-black px-3 py-1 rounded-full uppercase italic tracking-widest shadow-lg">
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
            <p class="text-[11px] font-black text-orange-600 uppercase mb-2 tracking-widest">🤔 Provocação do Mentor:
            </p>
            <p class="text-sm font-bold text-slate-700">
              {{ selectedMission.provocacao }}
            </p>
          </div>

          <button
            class="w-full py-5 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-green-100 transition-all active:scale-95 group"
            @click="shareAgain(selectedMission)">
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
.modal-enter-active,
.modal-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* Garante que o body não role quando o modal estiver aberto */
.modal-open {
  overflow: hidden;
}
</style>