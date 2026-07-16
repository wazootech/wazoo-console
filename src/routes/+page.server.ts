import { fail, type Actions } from "@sveltejs/kit";
import { apiBaseUrl } from "$lib/env.server";

export const actions: Actions = {
  default: async ({ fetch, platform, request }) => {
    const form = await request.formData();
    const response = await fetch(`${apiBaseUrl(platform?.env)}/v1/betaApplications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        applicantName: form.get("applicantName"),
        company: form.get("company"),
        useCase: form.get("useCase"),
        turnstileToken: form.get("turnstileToken")
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return fail(response.status, { message: payload.error?.message ?? "Application failed." });
    }
    return { message: "Application received. We will follow up soon." };
  }
};
