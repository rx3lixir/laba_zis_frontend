<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-stone-100 p-8">
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- User Info Card -->
    <div class="p-8 bg-white rounded-lg shadow">
      <h1 class="text-3xl font-bold text-stone-700 mb-4">
        Welcome, {data.user?.username}! 👋
      </h1>
      
      <p class="text-stone-600 mb-4">
        Email: {data.user?.email}
      </p>
      
      <form method="POST" action="/signout">
        <button 
          type="submit"
          class="cursor-pointer rounded-md bg-red-500 px-4 py-2 text-white font-medium hover:bg-red-400 transition-colors"
        >
          Sign Out
        </button>
      </form>
    </div>

    <!-- Create Room Form -->
    <div class="p-8 bg-white rounded-lg shadow">
      <h2 class="text-2xl font-bold text-stone-700 mb-4">Create New Room</h2>
      
      <form method="POST" action="?/createRoom" class="space-y-4">
        <div>
          <label for="participant" class="block text-sm font-medium text-stone-700 mb-2">
            Participant Email
          </label>
          <input
            id="participant"
            name="participant"
            type="email"
            required
            placeholder="friend@example.com"
            class="block w-full rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        
        <button
          type="submit"
          class="cursor-pointer w-full rounded-md bg-blue-500 px-4 py-2 text-white font-medium hover:bg-blue-400 transition-colors"
        >
          Create Room
        </button>
      </form>
    </div>

    <!-- Rooms List -->
    <div class="p-8 bg-white rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-stone-700">
          Your Rooms
        </h2>
        <span class="text-sm text-stone-500">
          {data.roomsCount} {data.roomsCount === 1 ? 'room' : 'rooms'}
        </span>
      </div>

      {#if data.error}
        <div class="rounded-md bg-red-100 p-4 border-red-200 border-2 mb-4">
          <p class="text-sm text-red-800">{data.error}</p>
        </div>
      {/if}

      {#if data.rooms.length === 0}
        <p class="text-stone-500 text-center py-8">
          No rooms yet. Create one to start chatting! 🎉
        </p>
      {:else}
        <div class="space-y-3">
          {#each data.rooms as room}
            <div class="cursor-pointer border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-semibold text-stone-700">
                    Room {room.room.id.slice(0, 8)}...
                  </h3>
                  <p class="text-sm text-stone-500 mt-1">
                    {room.participants.length} {room.participants.length === 1 ? 'participant' : 'participants'}
                  </p>
                  <div class="flex gap-2 mt-2">
                    {#each room.participants as participant}
                      <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {participant.user_id === data.user?.id ? 'You' : participant.user_id.slice(0, 8)}
                      </span>
                    {/each}
                  </div>
                </div>
                <a 
                  href="/room/{room.room.id}"
                  class="text-blue-500 hover:text-blue-400 text-sm font-medium"
                >
                  Open →
                </a>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
