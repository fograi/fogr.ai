export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);

    // ✅ Handle API route
    if (url.pathname === "/api/submit" && request.method === "POST") {
      return new Response("Hello, world!", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 🚀 Let Next.js handle everything else
    return env.ASSETS.fetch(request);
  },
};
