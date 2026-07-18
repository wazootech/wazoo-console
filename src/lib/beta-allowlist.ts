export const ALLOWED_EMAILS = new Set([
  "johncnmanuel@gmail.com",
  "sethc@pestcareusa.com",
  "klimekzc@gmail.com",
  "mikesite2@yahoo.com",
  "magicat888@gmail.com",
  "ethan.r.davidson@gmail.com",
  "jeffkazzee@gmail.com",
]);

export function isAllowed(email: string): boolean {
  return ALLOWED_EMAILS.has(email.toLowerCase());
}
