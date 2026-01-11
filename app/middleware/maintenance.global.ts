export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  
  // Pegamos a variável do .env ou do painel do Netlify
  const isMaintenance = config.public.maintenanceMode === 'true'

  // Se estiver em manutenção e a página atual NÃO for a de manutenção, redireciona
  if (isMaintenance && to.path !== '/manutencao') {
    return navigateTo('/manutencao')
  }

  // Se NÃO estiver em manutenção e o usuário tentar entrar na página de manutenção, volta pra home
  if (!isMaintenance && to.path === '/manutencao') {
    return navigateTo('/')
  }
})