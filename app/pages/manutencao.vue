<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
    <div class="max-w-md">
      <div class="text-9xl mb-8 animate-pulse">🛠️</div>
      
      <h1 class="text-4xl font-black text-blue-900 uppercase italic leading-tight mb-4">
        Pausa para <span class="text-orange-500">Melhorias!</span>
      </h1>
      
      <p class="text-slate-600 font-medium mb-8 leading-relaxed">
        Ei, time! Estamos ajustando os motores do nosso portal para trazer missões ainda mais incríveis. Voltamos em instantes!
      </p>

      <div class="bg-white p-6 rounded-[2rem] shadow-xl border-2 border-blue-100 inline-block w-full">
        <div class="flex items-center justify-center gap-2 mb-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
          </span>
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Status do Sistema</span>
        </div>
        <p class="font-bold text-blue-900">Atualizando Banco de Missões ODS</p>
      </div>

      <div class="mt-12 text-slate-400 text-xs font-medium uppercase tracking-tighter">
        Projeto Ceará de Valores • Governo do Estado do Ceará
      </div>
    </div>
  </div>
</template>

<script setup>
// Desabilitamos o layout padrão para esta página
definePageMeta({
  layout: false
})
</script>