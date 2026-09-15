export function isUnrecognizedWorldTokenError(
  status: number,
  message: string,
  code?: string,
): boolean {
  if (status === 401 || status === 403) return true;

  const text = `${code ?? ""} ${message}`
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
  const apiKey = "api key";

  return (
    new RegExp(
      `\\b(?:missing|invalid|absent|no)\\b.{0,48}\\b${apiKey}\\b`,
    ).test(text) ||
    new RegExp(
      `\\b${apiKey}\\b.{0,48}\\b(?:missing|invalid|absent|required|not provided|not found|not recognized)\\b`,
    ).test(text)
  );
}
