<script lang="ts">
  import type { SubmitFunction } from "@sveltejs/kit";

  import { enhance } from "$app/forms";
  import { goto} from "$app/navigation";

  let email = $state('');
  let password = $state('');
  let username = $state('');

  let isSubmitting = $state(false);
  let errors = $state<{ 
    username?: string;
    email?: string; 
    password?: string; 
    general?: string 
  }>({});

  const validateEmail = (value: string): string | undefined => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return undefined;
  }

  const validatePassword = (value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters long';
    return undefined;
  }
  
  const handleSubmit: SubmitFunction= () => {
  console.log('[SignInForm] Form submission started');

  isSubmitting = true;
  errors = {};

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (emailError || passwordError) {
    console.log('[SignUpForm] Validation failed', { emailError, passwordError });
    errors = {
      email: emailError,
      password: passwordError
    };
    isSubmitting = false;
    return () => {};
  }

  console.log('[SignUpForm] Validation passed, submitting to server');

  return async ({ result, update }) => {
    console.log('[SignUpForm] Server response received', { type: result.type });

    await update();

    // Check for successful signin
    if (result.type === 'success' && result.data?.success) {
      console.log('[SignUpForm] Sign up successful, redirecting to home');
      goto("/");
    } else if (result.type === 'failure') {
      console.log('[SignUpForm] Sign up failed', { error: result.data?.error });
      errors = { general: result.data?.error || "Sign up failed" };
    }
      
    isSubmitting = false;
    };
  };
</script>

<div class="max-w-md w-full space-y-8 p-8 bg-stone-100 rounded-lg shadow">
  <!-- Header -->
  <div>
    <h2 class="text-3xl text-stone-700 font-bold text-center">Sign Up 🔑</h2>
  </div>

  <form 
    method="POST" 
    action="?/signup" 
    use:enhance={handleSubmit}
    class="w-full max-w-md space-y-6"
  >
    <!-- Error appearing block -->
    {#if errors.general}
      <div class="rounded-md bg-red-100 p-4 border-red-200 border-2">
        <p class="text-sm text-red-800">{errors.general}</p>
      </div>
    {/if}

    <!-- Username block -->
    <div class="space-y-2">
      <label for="email" class="block text-sm font-medium text-stone-700">
        Username 
      </label>

      <input 
        id="username"
        name="username"
        type="username"
        autocomplete="username"
        required
        bind:value={username}
        class="block w-full rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        class:border-red-400={errors.username}
      />

      {#if errors.username}
        <p class="text-sm text-red-600">{errors.username}</p>
      {/if}
    </div>

    <!-- Email block -->
    <div class="space-y-2">
      <label for="email" class="block text-sm font-medium text-stone-700">
        Email
      </label>

      <input 
        id="email"
        name="email"
        type="email"
        autocomplete="email"
        required
        bind:value={email}
        class="block w-full rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        class:border-red-400={errors.email}
      />

      {#if errors.email}
        <p class="text-sm text-red-600">{errors.email}</p>
      {/if}
    </div>

    <!-- Password block -->
    <div class="space-y-2">
      <label for="password" class="block text-sm font-medium text-stone-700">
        Password
      </label>

      <input
        id="password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
        bind:value={password}
        class="block w-full rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        class:border-red-500={errors.password}
      />

      {#if errors.password}
        <p class="text-sm text-red-600">{errors.password}</p>
      {/if}
    </div>

    <!-- Submit button -->
    <button
      type="submit"
      disabled={isSubmitting}
      class="w-full rounded-md bg-blue-500 px-4 py-2 text-white font-medium hover:bg-blue-400 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? 'Signing in...' : 'Sign in'}
    </button>

    <!-- Signup redirect button -->
    <p class="text-center text-sm text-stone-800">
      Have account already?
      <a href="/signin" class="text-blue-500 hover:underline">Login</a>
    </p>
  </form>
</div>
