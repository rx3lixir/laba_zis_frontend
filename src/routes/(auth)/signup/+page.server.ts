import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const log = {
  info: (message: string, data?: any) => {
    console.log(`[SIGNIN INFO] ${message}`, data ? data : "");
  },
  error: (message: string, error?: any) => {
    console.error(`[SIGNIN ERROR] ${message}`, error ? error : "");
  },
  debug: (message: string, data?: any) => {
    console.log(`[SIGNIN DEBUG] ${message}`, data ? data : "");
  },
};

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    log.info("User already authenticated, redirecting to home", {
      userId: locals.user.id,
      username: locals.user.username,
    });
    throw redirect(303, "/");
  }
  log.debug("Loading signin page for unauthenticated user");
  return {};
};

export const actions = {
  signup: async ({ request, cookies, fetch }) => {
    const formData = await request.formData();

    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const username = formData.get("username")?.toString();

    log.info("Signup attempt", {
      email: email?.toLowerCase().trim(),
      username: username,
      password: password,
    });

    if (!email || !username || !password) {]
      log.error("Validation failed: missing email or password");
      return fail(400, {
        error: "Email and password are required",
        email: email || "",
        username: username || "",
      });
    }
  },
};
