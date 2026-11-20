/**
 * Starts sign-in; resolves to where to send the browser, or an error. `error`
 * is null when the server gave no message, so the caller can show a translated
 * default.
 */
export async function requestSignIn(): Promise<
  { redirectTo: string } | { error: string | null }
> {
  try {
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ ageConfirmed: true }),
    });
    const location = res.headers.get("location");
    if (res.redirected || (location && res.status >= 300 && res.status < 400)) {
      return { redirectTo: location ?? res.url };
    }
    const body = (await res.json().catch(() => {
      throw new Error("Could not read the sign-in response as JSON");
    })) as {
      url?: string;
      error?: { message?: string };
    };
    if (!res.ok || !body.url) {
      return { error: body.error?.message ?? null };
    }
    return { redirectTo: body.url };
  } catch (err) {
    console.error("Could not start sign-in", err);
    return { error: null };
  }
}
