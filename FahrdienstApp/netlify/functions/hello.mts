export default function handler(request: Request): Response {
    return new Response("Hallo von der Edge-Funktion!", {
        headers: { "Content-Type": "text/plain" },
    });
}
