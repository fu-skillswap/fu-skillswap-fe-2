const verifierKey = "skillswap_google_pkce_verifier";

function base64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function generateCodeVerifier() {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export async function generateCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export function saveCodeVerifier(verifier: string) { sessionStorage.setItem(verifierKey, verifier); }
export function takeCodeVerifier() { const verifier = sessionStorage.getItem(verifierKey); sessionStorage.removeItem(verifierKey); return verifier; }
export function clearCodeVerifier() { sessionStorage.removeItem(verifierKey); }
