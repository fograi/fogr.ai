interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async () =>
  new Response(JSON.stringify({ error: "Random failure for testing." }), {
    status: 500,
  });
