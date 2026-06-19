function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function deriveWsUrl(apiUrl: string): string {
  const normalizedApi = trimTrailingSlash(apiUrl);
  
  // Convert http/https protocols to ws/wss automatically if missing
  let wsProtocolUrl = normalizedApi;
  if (normalizedApi.startsWith("https://")) {
    wsProtocolUrl = normalizedApi.replace(/^https:\/\//, "wss://");
  } else if (normalizedApi.startsWith("http://")) {
    wsProtocolUrl = normalizedApi.replace(/^http:\/\//, "ws://");
  }

  if (wsProtocolUrl === "/api") {
    return "";
  }
  if (wsProtocolUrl.endsWith("/api")) {
    return wsProtocolUrl.slice(0, -4);
  }
  return wsProtocolUrl;
}

// Rest of your functions (getPublicEnv, buildWhatsAppUrl) remain exactly the same

export function getPublicEnv(): {
  apiUrl: string;
  wsUrl: string;
} {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL environment variable is required");
  }

  const wsEnv = process.env.NEXT_PUBLIC_WS_URL;
  const wsUrl =
    wsEnv === "/api"
      ? ""
      : wsEnv && wsEnv.length > 0
        ? wsEnv
        : deriveWsUrl(apiUrl);
  return {
    apiUrl: trimTrailingSlash(apiUrl),
    wsUrl: trimTrailingSlash(wsUrl),
  };
}

export function buildWhatsAppUrl(e164Digits: string, message: string): string {
  const digitsOnly = e164Digits.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digitsOnly}?text=${encoded}`;
}
