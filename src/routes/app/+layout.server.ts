import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { isAllowed } from "$lib/beta-allowlist";

export const load: LayoutServerLoad = async ({ request, fetch, platform, url }) => {
  const email = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (!email) {
    throw redirect(302, `https://console.wazoo.dev/cdn-cgi/access/login/${url.pathname}${url.search}`);
  }

  const allowed = await isAllowed(email, platform?.env as Record<string, string | undefined> | undefined);
  if (!allowed) {
    return { user: null, error: "Your email is not yet approved for beta access." };
  }

  return { user: { email }, error: null };
};
