// composables/useUser.ts
export const useUser = () => {
  // Estado global compartilhado em todo o Nuxt
  const userData = useState('user_data', () => ({
    nome: '',
    municipio: '',
    username: '',
    user_id: null
  }));

  const setUsuario = (dados) => {
    userData.value = { ...userData.value, ...dados };
  };

  const limparUsuario = () => {
    userData.value = { nome: '', municipio: '', username: '', user_id: null };
  };

  return { userData, setUsuario, limparUsuario };
}