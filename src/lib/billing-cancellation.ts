import type {
  CancelWorldSubscriptionError,
  CancelWorldSubscriptionResponse,
} from "@wazoo/client";

/**
 * The response body returned from the billing cancellation API endpoint.
 * Shows the billing information and the error message. Can be empty as a fallback (due to unfortunate circumstances).
 */
export type BillingCancellationBody = {
  billing?: CancelWorldSubscriptionResponse["billing"];
  error?: Pick<CancelWorldSubscriptionError["error"], "message">;
};
