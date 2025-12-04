import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const BACKEND_URL = "http://localhost:8080";

const handleAuth: Handle = async ({ event, resolve }) => {
  const refreshToken = event.cookies.get("refreshToken");

  event.locals.user = null;
  event.locals.accessToken = null;

  if (refreshToken) {
    try {
      console.log(
        "Refresh token detected in cookies. Rotating access token...",
      );

      const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Rotating access token response:", data.refresh_token);

        event.cookies.set("refreshToken", data.refresh_token, {
          path: "/",
          httpOnly: true,
          secure: false, // Set to true in production
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        event.locals.user = data.user;
        event.locals.accessToken = data.access_token;

        console.log(
          "New access token is being set to locals",
          data.accessToken,
        );
      } else {
        console.log("Deleting refresh token. Response is bad");
        event.cookies.delete("refreshToken", { path: "/" });
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
      event.cookies.delete("refreshToken", { path: "/" });
    }
  }

  return resolve(event);
};

// Export the sequence of handles
export const handle = sequence(handleAuth);
