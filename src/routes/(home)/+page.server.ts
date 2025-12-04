import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../(auth)/signin/$types";

export const load: PageServerLoad = async ({ locals }) => {
  // If user is not authenticated, redirect to signin
  if (!locals.user) {
    throw redirect(303, "/signin");
  }

  return {
    user: locals.user,
  };
};
