-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents
create table if not exists memories (
  id bigserial primary key,
  content text, -- The text content of the memory
  type text, -- 'conversation', 'journal', 'fact'
  user_id uuid references auth.users(id), -- Linked to the user
  embedding vector(768), -- Gemini Text-Embedding-004 uses 768 dimensions
  created_at timestamptz default now()
);

-- Create a function to search for memories
create or replace function match_memories (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
) returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    memories.id,
    memories.content,
    1 - (memories.embedding <=> query_embedding) as similarity
  from memories
  where 1 - (memories.embedding <=> query_embedding) > match_threshold
  and memories.user_id = p_user_id
  order by memories.embedding <=> query_embedding
  limit match_count;
end;
$$;
