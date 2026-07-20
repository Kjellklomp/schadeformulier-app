const SESSION_ID_LENGTH = 8;
const SESSION_ID_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function genSessionId(): string {
  const bytes = new Uint8Array(SESSION_ID_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SESSION_ID_CHARSET[b % SESSION_ID_CHARSET.length]).join("");
}
