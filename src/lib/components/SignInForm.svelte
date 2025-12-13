<script lang="ts">
  import { type SubmitFunction } from "@sveltejs/kit";

  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";

  let email = $state('');
  let password = $state('');

  let isSubmitting = $state(false);
  let errors = $state<{ email?: string; password?: string; general?: string }>({});

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

  const handleSubmit: SubmitFunction = () => {
    console.log('[SignInForm] Form submission started');

    isSubmitting = true;
    errors = {};

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      console.log('[SignInForm] Validation failed', { emailError, passwordError });
      errors = {
        email: emailError,
        password: passwordError
      };
      isSubmitting = false;
      return () => {};
    }

    console.log('[SignInForm] Validation passed, submitting to server');

    return async ({ result, update }) => {
      console.log('[SignInForm] Server response received', { type: result.type });

      await update();

      // Check for successful signin
      if (result.type === 'success' && result.data?.success) {
        console.log('[SignInForm] Sign in successful, redirecting to home');
        goto("/");
      } else if (result.type === 'failure') {
        console.log('[SignInForm] Sign in failed', { error: result.data?.error });
        errors = { general: result.data?.error || "Sign in failed" };
      }
      
      isSubmitting = false;
    };
  };
</script>

<div class="max-w-md w-full space-y-8 p-8 bg-stone-100 rounded-lg shadow">
  <!-- Header -->
  <div>
    <h2 class="text-3xl text-stone-700 font-bold text-center">Sign In 🚪</h2>
  </div>

  <form 
    method="POST" 
    action="?/signin" 
    use:enhance={handleSubmit}
    class="w-full max-w-md space-y-6"
  >
    <!-- Error appearing block -->
    {#if errors.general}
      <div class="rounded-md bg-red-100 p-4 border-red-200 border-2">
        <p class="text-sm text-red-800">{errors.general}</p>
      </div>
    {/if}

    <!-- Email block -->
    <div class="space-y-2">
      <Label for="email">Email</Label>

      <Input 
        id="email" 
        name="email"
        type="email"
        autocomplete="email"
        required
        bind:value={email}
      />

      {#if errors.email}
        <p class="text-sm text-red-600">{errors.email}</p>
      {/if}
    </div>

    <!-- Password block -->
    <div class="space-y-2">
      <Label for="email">Password</Label>

      <Input 
        id="password" 
        name="password"
        type="password"
        autocomplete="current-password"
        required
        bind:value={password}
      ></Input>

      {#if errors.password}
        <p class="text-sm text-red-600">{errors.password}</p>
      {/if}
    </div>

    <!-- Submit button -->
    <Button 
      type="submit"
      disabled={isSubmitting}
    >
      {isSubmitting ? 'Signing in...' : 'Sign in'}
    </Button>
    <!-- Signup redirect button -->
    <p class="text-center text-sm text-stone-800">
      Not registered yet?
      <a href="/signup" class="text-blue-500 hover:underline">Signup</a>
    </p>
  </form>
</div>
