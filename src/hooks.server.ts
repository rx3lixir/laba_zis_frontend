import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const BACKEND_URL = "http://localhost:8080";

const log = {
  info: (message: string, data?: any) => {
    console.log(`[AUTH HOOK INFO] ${message}`, data ? data : "");
  },
  error: (message: string, error?: any) => {
    console.error(`[AUTH HOOK ERROR] ${message}`, error ? error : "");
  },
  debug: (message: string, data?: any) => {
    console.log(`[AUTH HOOK DEBUG] ${message}`, data ? data : "");
  },
};

const handleAuth: Handle = async ({ event, resolve }) => {
  const refreshToken = event.cookies.get("refreshToken");

  // Intialize locals
  event.locals.user = null;
  event.locals.accessToken = null;

  if (!refreshToken) {
    log.debug(`No refresh token found for ${event.url.pathname}`);
    return resolve(event);
  }

  log.info(`Refresh token detected, rotating access token...`);

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      log.error(`Token refresh failed with status ${response.status}`);
      const errorText = await response.text();
      log.debug("Response body:", errorText);

      event.cookies.delete("refreshToken", { path: "/" });
      log.info("Deleted invalid refresh token from cookies");

      return resolve(event);
    }

    const data = await response.json();

    log.info("Token refresh successful", {
      userId: data.user?.id,
      username: data.user?.username,
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
    });

    // Set new refresh token
    event.cookies.set("refreshToken", data.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set locals for this request
    event.locals.user = data.user;
    event.locals.accessToken = data.access_token;

    log.debug("Locals updated with user data and access token");
  } catch (error) {
    log.error("Failed to refresh token - network or parsing error", error);
    event.cookies.delete("refreshToken", { path: "/" });
    log.info("Deleted refresh token after error");
  }

  return resolve(event);
};

// Export the sequence of handles
export const handle = sequence(handleAuth);
