export function onRequest() {
  return new Response("Hello, world!", {
    headers: { "Content-Type": "text/plain" },
  });
}
