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
    const loginRes = await fetch(`${ISERV_URL}/iserv/app/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!loginRes.ok) {
      return null;
    }

    const cookie = loginRes.headers.get("set-cookie");
    if (!cookie) return null;

    const sessionCookie = cookie.split(";")[0];

    const infoRes = await fetch(`${ISERV_URL}/iserv/app/user`, {
      headers: { Cookie: sessionCookie ?? "" },
    });

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
