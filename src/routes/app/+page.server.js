export async function load({ request }) {
  const email = request.headers.get("Cf-Access-Authenticated-User-Email") ?? "unknown";
  return { email };
}
