
const AMROD_API_URL = process.env.AMROD_API_URL;
const AMROD_LOGIN_URL =
  process.env.AMROD_LOGIN_URL || "https://identity.amrod.co.za/VendorLogin";

const AMROD_USERNAME = process.env.AMROD_USERNAME;
const AMROD_PASSWORD = process.env.AMROD_PASSWORD;
const AMROD_CUSTOMER_CODE = process.env.AMROD_CUSTOMER_CODE;

interface AmrodRequestOptions {
  method?: string;
  body?: unknown;
  cacheTtlSeconds?: number;
}

interface CacheEntry {
  expiresAt: number;
  data: unknown;
}

interface LoginResponse {
  Token?: string;
  token?: string;
  AccessToken?: string;
  access_token?: string;
  [key: string]: unknown;
}

/**
 * Amrod returns 204 No Content for every call during its nightly maintenance
 * window (00:00-01:00 SAST). Callers keep serving the last good data.
 */
export class AmrodUnavailableError extends Error {
  constructor(endpoint: string) {
    super(`Amrod returned no content for ${endpoint} (maintenance window?)`);
    this.name = "AmrodUnavailableError";
  }
}

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

let currentToken: string | null = null;
let tokenExpiresAt = 0;
let loginPromise: Promise<string> | null = null;

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

async function getAmrodToken(forceRefresh = false): Promise<string> {
  if (!AMROD_USERNAME || !AMROD_PASSWORD || !AMROD_CUSTOMER_CODE) {
    throw new Error("Amrod VendorLogin credentials are not configured");
  }

  if (
    !forceRefresh &&
    currentToken &&
    Date.now() < tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS
  ) {
    return currentToken;
  }

  if (loginPromise) {
    return loginPromise;
  }

  loginPromise = (async () => {
    const response = await fetch(AMROD_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        UserName: AMROD_USERNAME,
        Password: AMROD_PASSWORD,
        CustomerCode: AMROD_CUSTOMER_CODE,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Amrod VendorLogin error ${response.status}: ${await response.text()}`
      );
    }

    const loginText = await response.text();

    if (response.status === 204 || !loginText.trim()) {
      throw new AmrodUnavailableError("VendorLogin");
    }

    const result = JSON.parse(loginText) as LoginResponse;

    const findToken = (value: unknown): string | null => {
      if (!value || typeof value !== "object") return null;

      const data = value as Record<string, unknown>;

      for (const key of ["Token", "token", "AccessToken", "access_token"]) {
        if (typeof data[key] === "string" && data[key]) {
          return data[key] as string;
        }
      }

      for (const key of ["data", "result"]) {
        const nested = findToken(data[key]);
        if (nested) return nested;
      }

      return null;
    };

    const token = findToken(result);

    if (!token) {
      throw new Error(
        "Amrod VendorLogin succeeded but no recognised token field was found"
      );
    }

    currentToken = token;
    tokenExpiresAt = Date.now() + 55 * 60 * 1000;

    return token;
  })();

  try {
    return await loginPromise;
  } finally {
    loginPromise = null;
  }
}

async function amrodRequest<T>(
  endpoint: string,
  options: AmrodRequestOptions = {}
): Promise<T> {
  if (!AMROD_API_URL) {
    throw new Error("AMROD_API_URL is not configured");
  }

  const method = options.method ?? "GET";
  const cacheKey = `${method}:${endpoint}`;
  const ttlMs = (options.cacheTtlSeconds ?? 0) * 1000;

  if (ttlMs > 0) {
    const cached = memoryCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
            return cached.data as T;
    }

    if (cached) memoryCache.delete(cacheKey);

    console.log(`[Amrod cache MISS] ${endpoint}`);
  }

  const existingRequest = inFlightRequests.get(cacheKey);

  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const request = (async (): Promise<T> => {
    const sendRequest = (token: string) =>
      fetch(`${AMROD_API_URL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
      });

    let token = await getAmrodToken();
    let response = await sendRequest(token);

    if (response.status === 401) {
      if (currentToken === token) {
        currentToken = null;
        tokenExpiresAt = 0;
      }

      token = await getAmrodToken();
      response = await sendRequest(token);
    }

    if (!response.ok) {
      throw new Error(
        `Amrod API error ${response.status}: ${await response.text()}`
      );
    }

    if (response.status === 204) {
      throw new AmrodUnavailableError(endpoint);
    }

    const raw = await response.text();

    if (!raw.trim()) {
      throw new AmrodUnavailableError(endpoint);
    }

    const data = JSON.parse(raw) as T;

    if (ttlMs > 0) {
      memoryCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + ttlMs,
      });
    }

    return data;
  })();

  inFlightRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    if (inFlightRequests.get(cacheKey) === request) {
      inFlightRequests.delete(cacheKey);
    }
  }
}

export function getAmrodProducts<T>() {
  return amrodRequest<T>("/api/v1/Products/", {
    cacheTtlSeconds: 600,
  });
}

export function getAmrodPrices<T>() {
  return amrodRequest<T>("/api/v1/Prices/", {
    cacheTtlSeconds: 300,
  });
}

export function getAmrodStock<T>() {
  return amrodRequest<T>("/api/v1/Stock/", {
    cacheTtlSeconds: 60,
  });
}
