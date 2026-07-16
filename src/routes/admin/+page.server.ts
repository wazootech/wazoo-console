import { fail, type Actions } from "@sveltejs/kit";
import { adminToken, apiBaseUrl } from "$lib/env.server";
import type { PageServerLoad } from "./$types";

type Application = {
  uid: string;
  email: string;
  applicantName: string;
  company?: string;
  useCase: string;
  state: string;
  createTime: string;
};

async function adminFetch(fetcher: typeof fetch, platformEnv: App.Platform["env"] | undefined, path: string, init: RequestInit = {}) {
  return fetcher(`${apiBaseUrl(platformEnv)}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${adminToken(platformEnv)}`,
      "content-type": "application/json",
      ...init.headers
    }
  });
}

export const load: PageServerLoad = async ({ fetch, platform }) => {
  try {
    const response = await adminFetch(fetch, platform?.env, "/v1/betaApplications?state=PENDING");
    const payload = await response.json().catch(() => ({}));
    return { applications: (payload.applications ?? []) as Application[], error: response.ok ? "" : payload.error?.message ?? "Unable to load applications" };
  } catch (error) {
    return { applications: [] as Application[], error: error instanceof Error ? error.message : "Unable to load applications" };
  }
};

export const actions: Actions = {
  approve: async ({ fetch, platform, request }) => {
    const form = await request.formData();
    const uid = String(form.get("uid"));
    const response = await adminFetch(fetch, platform?.env, `/v1/betaApplications/${uid}:approve`, {
      method: "POST",
      body: JSON.stringify({
        organizationId: form.get("organizationId"),
        displayName: form.get("displayName"),
        reviewNote: form.get("reviewNote")
      })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      return fail(response.status, { message: payload.error?.message ?? "Approval failed." });
    }
    return { message: "Application approved." };
  },
  reject: async ({ fetch, platform, request }) => {
    const form = await request.formData();
    const uid = String(form.get("uid"));
    const response = await adminFetch(fetch, platform?.env, `/v1/betaApplications/${uid}:reject`, {
      method: "POST",
      body: JSON.stringify({ reviewNote: form.get("reviewNote") })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      return fail(response.status, { message: payload.error?.message ?? "Rejection failed." });
    }
    return { message: "Application rejected." };
  }
};
