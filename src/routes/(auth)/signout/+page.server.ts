import type { Actions } from "./$types";
import { redirect } from "@sveltejs/kit";

export const actions = {
  default: async ({ cookies }) => {
    // Clear the refresh token cookie
    cookies.delete("refreshToken", { path: "/" });

    // Redirect to signin page
    throw redirect(303, "/signin");
  },
} satisfies Actions;
