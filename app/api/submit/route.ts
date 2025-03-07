export const runtime = "edge"; // Required for Cloudflare Pages

export async function POST() {
  return new Response("Hello, world!", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
