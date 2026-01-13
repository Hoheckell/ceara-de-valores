
const supabase = useSupabaseClient();
const loginOuCadastro = async (username, senha, municipioSelecionado) => {
  const emailSintetico = `${username.toLowerCase()}@cv.local`
  
  // 1. Tenta cadastrar
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: emailSintetico,
    password: senha,
  })

  // 2. Se for um usuário novo, cria o perfil com o município
  if (authData?.user && !signUpError) {
    await supabase.from('perfis').insert({
      id: authData.user.id,
      username: username,
      municipio: municipioSelecionado
    })
  }

  // 3. Se o erro for "User already registered", tenta apenas o login
  if (signUpError?.status === 400) {
    await supabase.auth.signInWithPassword({
      email: emailSintetico,
      password: senha,
    })
  }
}