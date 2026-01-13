
<script setup>
import { ref} from 'vue'
const { userData } = useUser();
// Estados do Simulador
const step = ref('form') // form, loading, result
const formData = ref({
  user_id: userData.value.user_id,
  afinidade: '',
  problema: '',
  habilidade: ''
})
const missionResult = ref(null)
// Opções de afinidade (Baseadas nos ODS)
const afinidades = [
  { id: 'social', label: 'Acabar com a pobreza e a fome', icon: '🍎', ods: 'ODS 1 e 2' },
  { id: 'ambiental', label: 'Proteger a natureza e o clima', icon: '🌿', ods: 'ODS 13 e 15' },
  { id: 'direitos', label: 'Educação e Saúde para todos', icon: '📚', ods: 'ODS 3 e 4' },
  { id: 'cidades', label: 'Cidades limpas e sustentáveis', icon: '🏙️', ods: 'ODS 11' }
]

// Opções de Habilidades
const habilidades = [
  { id: 'comunicador', label: 'Falar e mobilizar pessoas', icon: '📢' },
  { id: 'maker', label: 'Criar soluções e tecnologia', icon: '🛠️' },
  { id: 'gestor', label: 'Organizar e planejar ações', icon: '📋' }
]

const gerarMissao = async () => {
  step.value = 'loading'
  try {
    const data = await $fetch('/api/generate-mission', {
      method: 'POST',
      body: formData.value
    })
    missionResult.value = JSON.parse(data['text']); // Ajuste conforme o formato de saída do seu Flowise
    step.value = 'result';
  } catch (error) {
    console.error("Erro ao conectar com a IA", error)
    step.value = 'form'
  }
}
const shareOnWhatsapp = () => {
  const text = `🚀 Acabei de gerar uma Missão ODS no Ceará de Valores! \n\nMinha missão: ${missionResult.value.titulo}\nFoco: ${missionResult.value.ods}\n\nBora mudar o mundo?`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <div class="text-center mb-4">
      <h2 class="text-2xl font-black text-blue-900 uppercase italic">Simulador de Impacto 🚀</h2>
      <p class="text-slate-500 text-sm">Transforma a tua realidade através dos ODS<br><em>Objetivos de Desenvolvimento Sustentável</em></p>
      <p v-if="estaLogado == false" class="text-blue text-sm">Faça login abaixo para simular uma missão</p>
    </div>

          <a
href="/imagens/ods-objetivos-sustentaveis-1.png" target="_blank"
            class="flex items-center justify-center gap-2 mb-4 w-full py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl text-blue-700 text-md font-bold hover:bg-blue-50 hover:border-blue-200 transition-all">
            <span>📖</span>
            <span>Painel dos ODS</span>
          </a>
    <div v-if="(step === 'form' && userData.username != '')" class="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-6">
      <div>
        <label class="block text-sm font-bold text-slate-700 mb-3 text-center uppercase tracking-wide">1. O que mais te motiva a mudar o mundo?</label>
        <div class="grid grid-cols-2 gap-3">
          <button 
            v-for="opt in afinidades" :key="opt.id"
            :class="['p-4 rounded-2xl border-2 transition-all text-sm font-bold flex flex-col items-center gap-2', 
                    formData.afinidade === opt.id ? 'border-blue-500 bg-blue-50 text-blue-700 scale-95' : 'border-slate-50 bg-slate-50 text-slate-500']"
            @click="formData.afinidade = opt.id"
          >
            <span class="text-2xl">{{ opt.icon }}</span>
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-bold text-slate-700 mb-3 text-center uppercase tracking-wide">2. Que problema vês na tua rua ou bairro?</label>
        <input 
          v-model="formData.problema"
          type="text" 
          placeholder="Ex: Falta de reciclagem, lixo na praça..."
          class="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-400 focus:bg-white transition-all outline-none font-medium"
        >
      </div>
      <div>
        <label class="block text-sm font-bold text-slate-700 mb-3 text-center uppercase tracking-wide">4. Qual é o teu superpoder?</label>
        <div class="flex gap-2">
          <button 
            v-for="hab in habilidades" :key="hab.id"
            :class="['flex-1 p-3 rounded-2xl border-2 transition-all text-xs font-bold flex flex-col items-center gap-1', 
                    formData.habilidade === hab.id ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-50 bg-slate-50 text-slate-500']"
            @click="formData.habilidade = hab.id"
          >
            <span class="text-xl">{{ hab.icon }}</span>
            {{ hab.label }}
          </button>
        </div>
      </div>

      <button 
        :disabled="!formData.afinidade || !formData.problema || !formData.habilidade"
        class="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-black rounded-2xl uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95"
        @click="gerarMissao"
      >
        Gerar Minha Missão ⚡
      </button>
    </div>

    <div v-if="step === 'loading'" class="bg-white rounded-3xl shadow-xl p-12 text-center animate-pulse">
      <div class="text-6xl mb-4">🧠</div>
      <h3 class="text-xl font-black text-blue-900 uppercase">A IA está a desenhar a tua missão...</h3>
      <p class="text-slate-400 mt-2">Conectando problemas locais a soluções globais</p>
    </div>

    <div v-if="step === 'result' && missionResult" class="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
      <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"/>
      
      <div class="relative z-10">
        <span class="bg-orange-500 text-[10px] font-black uppercase px-3 py-1 rounded-full italic">Missão Desbloqueada</span>
        <h3 class="text-3xl font-black mt-2 mb-4 leading-tight uppercase">{{ missionResult.titulo }}</h3>
        
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 mb-6">
          <p class="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2">🎯 Objetivo ODS</p>
          <p class="font-bold text-xl">{{ missionResult.ods }}</p>
        </div>

        <div class="space-y-4 mb-8">
          <p class="text-lg font-medium leading-relaxed italic">"{{ missionResult.desafio }}"</p>
          <div class="h-px bg-white/20 w-full"/>
          <p class="text-orange-300 font-bold text-sm">🤔 Provocação: {{ missionResult.provocacao }}</p>
        </div>

        <div class="flex flex-col gap-3">
          <button class="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all" @click="shareOnWhatsapp">
            <span>📱</span> PARTILHAR NO WHATSAPP
          </button>
          <button class="w-full py-4 bg-white/10 hover:bg-white/20 text-white/70 font-bold rounded-2xl transition-all" @click="step = 'form'">
            Criar Nova Missão
          </button>
        </div>
      </div>
    </div>
  </div>
</template>