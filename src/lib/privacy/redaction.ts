const sensitiveKeys = [
  "email",
  "password",
  "token",
  "apiKey",
  "api_key",
  "body",
  "prayer",
  "reflection",
  "aiQuestion",
  "aiAnswer",
] as const;

export function redactLogMetadata<T extends Record<string, unknown>>(metadata: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
        return [key, "[REDACTED]"];
      }

      return [key, value];
    }),
  );
}
