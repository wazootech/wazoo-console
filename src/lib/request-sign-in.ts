/** Starts sign-in; resolves to where to send the browser, or an error. */
export async function requestSignIn(): Promise<
  { redirectTo: string } | { error: string }
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
    const body = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: { message?: string };
    };
    if (!res.ok || !body.url) {
      return {
        error:
          body.error?.message ?? "Could not start sign-in. Please try again.",
      };
    }
    return { redirectTo: body.url };
  } catch {
    return { error: "Could not start sign-in. Please try again." };
  }
}
