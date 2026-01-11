// server/api/generate-mission.post.ts
import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const client = await serverSupabaseClient(event)
  const config = useRuntimeConfig()
  

  const url = process.env.FLOWISE_API_URL
  if (!url) {
    throw new Error('FLOWISE_API_URL environment variable is not defined')
  }

  const token = process.env.FLOWISE_TOKEN
  if (!token) {
    throw new Error('FLOWISE_TOKEN environment variable is not defined')
  }

  const response = await $fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      question: `Perfil: ${body.afinidade}, Problema: ${body.problema}, Superpoder: ${body.habilidade}`
    }
  })

  const mission = typeof response === 'string' ? JSON.parse(response) : response
  const missionObj = JSON.parse(mission['text']);
  // 2. Persistir no Supabase associando ao CPF
  const { error } = await client
    .from('missoes_ods')
    .insert({
      cpf: body.cpf, // CPF vindo do formulário
      titulo: missionObj.titulo,
      ods: missionObj.ods,
      desafio: missionObj.desafio,
      provocacao: missionObj.provocacao
    })

  if (error) {
    console.error('Erro ao salvar no Supabase:', error.message)
    // Mesmo com erro no banco, vamos retornar a missão para o aluno não travar
  }

  return mission
})
