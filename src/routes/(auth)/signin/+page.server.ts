import type { Actions } from "@sveltejs/kit";
import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // If user is already authenticated, redirect to home
  if (locals.user) {
    throw redirect(303, "/");
  }
  // Not authenticated, show signin page
  return {};
};

interface SigninResponse {
  user: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

interface ErrorResponse {
  error: string;
}

export const actions = {
  signin: async ({ request, cookies, fetch }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    // Servier side validation (belt and braces approach)
    if (!email || !password) {
      return fail(400, {
        error: "Email and password are required",
        email: email || "",
      });
    }

    try {
      // Request to API
      const response = await fetch("http://localhost:8080/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
        }),
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        return fail(response.status, {
          error: errorData.error || "Sign in failed",
          email,
        });
      }

      const data: SigninResponse = await response.json();

      console.log("Signin Response", data.user);

      // Storing refresh token in http-only cookie
      cookies.set("refreshToken", data.refreshToken, {
        path: "/",
        httpOnly: true,
        secure: false, // Set true with HTTPS
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
      });

      console.log(
        "Setting refresh token to http only cookie...",
        data.refreshToken,
      );

      // Return access token and user data to the client
      return {
        success: true,
        accessToken: data.accessToken,
        user: data.user,
      };
    } catch (error) {
      console.error("Signin error:", error);

      return fail(500, {
        error: "An unexpected error occured. Please try again.",
        email,
      });
    }
  },
} satisfies Actions;
