// server/api/claim-history.post.ts
import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const { cpf, userId } = await readBody(event)
  // serverSupabaseClient typings may not include your DB schema here; cast to any to avoid
  // "relation: never" overload errors when calling client.from(...)
  const client = await serverSupabaseClient(event)

  // 1. Atualiza o Scoreboard trocando CPF por UserID
  await client.from('respostas_quizzes').update({ user_id: userId }).eq('cpf', cpf)

  // 2. Atualiza as Missões ODS
  await client.from('missoes_ods').update({ user_id: userId }).eq('cpf', cpf)

  // 3. CRÍTICO: Deletar o CPF ou anonimizá-lo para cumprir a regra
  await client.from('respostas_quizzes').update({ cpf: 'ANONIMIZADO' }).eq('user_id', userId)
  await client.from('missoes_ods').update({ cpf: 'ANONIMIZADO' }).eq('user_id', userId)

  return { success: true }
})