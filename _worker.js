export default {
  async fetch(_request, _env, _ctx) {
    return new Response("Hello, world!", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};
