// server/api/update-user-admin.post.ts
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Criamos um cliente Supabase com privilégios de Admin
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
  );

  const { userId, novoUsername, novoNome, novoMunicipio } = body;
  const novoEmail = `${novoUsername}@aluno.cearadevalores.com.br`;

  try {
    // 1. Forçar atualização no AUTH (como Admin, o e-mail muda na hora)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: novoEmail, email_confirm: true }, // Confirma automaticamente
      );

    if (authError) throw authError;

    // 2. Atualizar a tabela PERFIS
    const { error: perfilError } = await supabaseAdmin
      .from("perfis")
      .update({
        nome: novoNome,
        username: novoUsername,
        municipio: novoMunicipio,
      })
      .eq("id", userId);

    if (perfilError) throw perfilError;

    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});
