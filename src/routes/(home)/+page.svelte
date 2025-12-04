<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-stone-100">
  <div class="max-w-md w-full p-8 bg-white rounded-lg shadow">
    <h1 class="text-3xl font-bold text-stone-700 mb-4">
      Welcome, {data.user?.username}! 👋
    </h1>
    
    <p class="text-stone-600 mb-4">
      Email: {data.user?.email}
    </p>
    
    <form method="POST" action="/signout">
      <button 
        type="submit"
        class="w-full rounded-md bg-red-500 px-4 py-2 text-white font-medium hover:bg-red-400 transition-colors"
      >
        Sign Out
      </button>
    </form>
  </div>
</div>
