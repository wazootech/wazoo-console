function matchesApiKeyAuthMessage(code: string | undefined, message: string) {
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

export function isUnrecognizedWorldTokenError(
  status: number,
  message: string,
  code?: string,
): boolean {
  if (status === 401) return true;
  if (status === 403) {
    return matchesApiKeyAuthMessage(code, message);
  }

  return matchesApiKeyAuthMessage(code, message);
}
