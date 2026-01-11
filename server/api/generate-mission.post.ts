// server/api/generate-mission.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // O payload enviado para o Flowise
  const payload = {
    overrideConfig: {
      vars: {
        afinidade: body.afinidade,
        problema: body.problema,
        habilidade: body.habilidade
      }
    }
  }

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
    body: payload
  })

  // Se o Flowise retornar uma string (text), fazemos o parse para JSON
  return typeof response === 'string' ? JSON.parse(response) : response
})