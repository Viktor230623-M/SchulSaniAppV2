import { logger } from "./logger";

const ISERV_URL = process.env["ISERV_URL"];
const ISERV_MOCK = process.env["ISERV_MOCK"] === "true";

export interface IServUserInfo {
  username: string;
  displayName: string;
  email: string;
}

export async function authenticateWithIServ(
  username: string,
  password: string,
): Promise<IServUserInfo | null> {
  if (ISERV_MOCK) {
    logger.info({ username }, "IServ mock auth: accepting credentials");
    return {
      username,
      displayName: username
        .split(".")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" "),
      email: `${username}@school.example`,
    };
  }

  if (!ISERV_URL) {
    logger.error("ISERV_URL is not set");
    return null;
  }

  try {
    const cookies: Record<string, string> = {};

    // Step 1: Follow redirects from /iserv/app/login to the credential form
    // Flow: /iserv/app/login → /iserv/auth/auth?... → /iserv/auth/login?_target_path=...
    let formUrl = await followRedirects(
      `${ISERV_URL}/iserv/app/login`,
      cookies,
      ISERV_URL,
    );
    if (!formUrl) return null;

    // Step 2: POST credentials to the login form
    const postResp = await fetch(formUrl, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: serializeCookies(cookies),
      },
      body: `_username=${encodeURIComponent(username)}&_password=${encodeURIComponent(password)}`,
    });

    collectCookies(postResp, cookies);

    // A redirect means credentials were accepted; staying on 200 = wrong password
    if (postResp.status < 300 || postResp.status >= 400) {
      return null;
    }

    const postLocation = postResp.headers.get("location");
    if (!postLocation) return null;

    // Step 3: Follow the post-login OAuth2 redirect chain to get the app session cookie
    const postLoginStart = postLocation.startsWith("http")
      ? postLocation
      : `${ISERV_URL}${postLocation}`;
    logger.info({ postLoginStart }, "Following post-login redirect chain");
    await followRedirects(postLoginStart, cookies, ISERV_URL);
    logger.info({ cookies: Object.keys(cookies) }, "Cookies after post-login redirect chain");

    // Step 4: Fetch user info with the accumulated session cookies
    logger.info({ cookies: Object.keys(cookies) }, "Cookies before /iserv/app/user");
    const infoRes = await fetch(`${ISERV_URL}/iserv/app/user`, {
      redirect: "manual",
      headers: { Cookie: serializeCookies(cookies) },
    });

    logger.info({ status: infoRes.status, url: `${ISERV_URL}/iserv/app/user` }, "user endpoint response");
    if (infoRes.status >= 300 && infoRes.status < 400) {
      logger.error({ location: infoRes.headers.get("location") }, "User endpoint redirected — session cookie invalid");
      return null;
    }
    if (!infoRes.ok) return null;

    const data = (await infoRes.json()) as {
      username?: string;
      name?: string;
      email?: string;
    };

    return {
      username: data.username ?? username,
      displayName: data.name ?? username,
      email: data.email ?? `${username}@school.example`,
    };
  } catch (err) {
    logger.error({ err }, "IServ authentication failed");
    return null;
  }
}

async function followRedirects(
  startUrl: string,
  cookies: Record<string, string>,
  baseUrl: string,
  maxHops = 8,
): Promise<string | null> {
  let url = startUrl;
  for (let i = 0; i < maxHops; i++) {
    const resp = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { Cookie: serializeCookies(cookies) },
    });
    collectCookies(resp, cookies);
    logger.info({ hop: i, status: resp.status, url }, "redirect hop");
    if (resp.status === 200) return url;
    if (resp.status < 300 || resp.status >= 400) return null;
    const loc = resp.headers.get("location");
    if (!loc) return null;
    url = loc.startsWith("http") ? loc : `${baseUrl}${loc}`;
  }
  return null;
}

function collectCookies(resp: Response, jar: Record<string, string>): void {
  // getSetCookie() is available in Node 18+ / undici
  const h = resp.headers as unknown as { getSetCookie?(): string[] };
  const headers =
    typeof h.getSetCookie === "function"
      ? h.getSetCookie()
      : (resp.headers.get("set-cookie") ?? "").split(/,(?=\s*\w+=)/);

  for (const header of headers) {
    const [nameValue] = header.split(";");
    if (!nameValue) continue;
    const eq = nameValue.indexOf("=");
    if (eq < 0) continue;
    const name = nameValue.slice(0, eq).trim();
    const value = nameValue.slice(eq + 1).trim();
    if (name) jar[name] = value;
  }
}

function serializeCookies(jar: Record<string, string>): string {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}
