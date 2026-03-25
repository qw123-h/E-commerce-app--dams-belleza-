import crypto from "node:crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

function getSecret() {
  return process.env.NEXTAUTH_SECRET ?? "dev-secret";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createDocumentToken(type: "invoice" | "receipt", documentNumber: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${type}:${documentNumber}:${expiresAt}`;
  const encodedPayload = toBase64Url(payload);
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyDocumentToken(
  token: string | null,
  type: "invoice" | "receipt",
  documentNumber: string
): boolean {
  if (!token) {
    return false;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expected = sign(encodedPayload);
  if (signature !== expected) {
    return false;
  }

  try {
    const raw = fromBase64Url(encodedPayload);
    const [tokenType, tokenDocNumber, tokenExp] = raw.split(":");

    if (tokenType !== type || tokenDocNumber !== documentNumber) {
      return false;
    }

    const exp = Number(tokenExp);
    if (!Number.isFinite(exp)) {
      return false;
    }

    return exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
