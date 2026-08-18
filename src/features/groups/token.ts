import crypto from "node:crypto";

export function createInvitationToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token: string): `sha256:${string}` {
  return `sha256:${crypto.createHash("sha256").update(token, "utf8").digest("hex")}`;
}
