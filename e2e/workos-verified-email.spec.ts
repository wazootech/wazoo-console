import { expect, test } from "@playwright/test";
import {
  emailNotVerifiedCode,
  requireVerifiedEmail,
} from "../src/lib/workos-user";

// Hermetic regression for wazootech/memory#71: the WorkOS callback must not
// mint an email-keyed console session for an email WorkOS has not verified.

const email = "person@example.test";

test.describe("requireVerifiedEmail", () => {
  test("returns the email when WorkOS reports it verified", () => {
    expect(requireVerifiedEmail({ email, emailVerified: true })).toBe(email);
  });

  for (const emailVerified of [false, null, undefined]) {
    test(`rejects emailVerified=${String(emailVerified)}`, () => {
      let thrown: unknown;
      try {
        requireVerifiedEmail({ email, emailVerified });
      } catch (err) {
        thrown = err;
      }
      expect((thrown as { code?: string } | undefined)?.code).toBe(
        emailNotVerifiedCode,
      );
    });
  }
});
