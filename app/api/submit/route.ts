export const runtime = "edge"; // Required for Cloudflare Pages

export async function POST() {
  return new Response("Hello, world, I am the API route!", {
    status: 500,
    headers: { "Content-Type": "text/plain" },
  });
}
