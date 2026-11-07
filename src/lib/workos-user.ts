export const emailNotVerifiedCode = "EMAIL_NOT_VERIFIED";

/**
 * The console keys accounts by email, so only an email WorkOS reports as
 * verified may be used to mint a session. Fails closed: anything other than
 * an explicit `true` is rejected (wazootech/memory#71).
 */
export function requireVerifiedEmail(user: {
  email: string;
  emailVerified?: boolean | null;
}): string {
  if (user.emailVerified !== true) {
    const err = new Error("WorkOS email is not verified.");
    (err as Error & { code?: string }).code = emailNotVerifiedCode;
    throw err;
  }
  return user.email;
}
