# 🌟 Plataforma de Revisão: Ceará de Valores

Este é um Web App interativo desenvolvido para o programa **Ceará de Valores**. Permite aos jovens revisarem conteúdos das Trilhas 1 e 2 de forma gamificada, com registo de dados no Supabase.

## 🚀 Funcionalidades

- **Seleção de Trilhas:** Navegação entre Trilha 1 (Socioemocional) e Trilha 2 (Cidadania).
- **Validação de CPF:** Máscara automática e validação matemática do documento.
- **Autocomplete de Municípios:** Lista oficial das 184 cidades do Ceará para evitar erros.
- **Quiz Dinâmico:** Embaralhamento de opções e feedback educativo imediato.
- **Persistência:** Registo de nome, município, CPF, pontuação e data/hora no Supabase.

## 🛠️ Stack Tecnológica

- **Nuxt 3** + **Tailwind CSS**
- **Supabase** (PostgreSQL + RLS)
- **Netlify** (Deployment)

## 🗄️ Setup do Banco (SQL)

```sql
create table respostas_quizzes (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  cpf text not null,
  municipio text not null,
  trilha_id int,
  aula_id int,
  aula_titulo text,
  pontuacao int,
  total_questoes int,
  created_at timestamptz default now()
);
alter table respostas_quizzes enable row level security;
create policy "Public Insert" on public.respostas_quizzes for insert with check (true);
