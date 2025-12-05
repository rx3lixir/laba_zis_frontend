<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { PageData } from "./$types";

  let {data}: {data: PageData} = $props();
  
  // WebSocket state
  let ws: WebSocket | null = $state(null);
  let isConnected = $state(false);
  let connectionError = $state<string | null>(null);
  let reconnectAttempts = $state(0);

  const log = {
    info: (message: string, logData?: any) => {
      console.log(`[WS CLIENT INFO] ${message}`, logData ? logData : '');
    },
    error: (message: string, error?: any) => {
      console.error(`[WS CLIENT ERROR] ${message}`, error ? error : '');
    },
    debug: (message: string, logData?: any) => {
      console.log(`[WS CLIENT DEBUG] ${message}`, logData ? logData : '');
    },
  };

  function connectWebSocket() {
    log.info("Attempting to connect to WebSocket", {
      roomID: data.room.id,
      attempt: reconnectAttempts + 1,
    });

    try {
      const wsUrl = `ws://localhost:8080/api/ws?room`;

      log.debug('Creating WebSocket connection', { url: wsUrl.replace(data.accessToken, 'TOKEN_HIDDEN') });

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        log.info("WebSocket connected successfully");
        isConnected = true;
        connectionError = null;
        reconnectAttempts = 0;
      }

      ws.onmessage = (event) => {
        log.debug('WebSocket message received', { data: event.data });
        // Handle incoming messages here
        try {
          const message = JSON.parse(event.data);
          log.info('Parsed message', { type: message.type, message });
          // Add your message handling logic here
        } catch (error) {
          log.error('Failed to parse message', { error, raw: event.data });
        }
      }

      ws.onerror = (error) => {
        log.error('WebSocket error occurred', error);
        connectionError = 'Connection error occurred';
      };

      ws.onclose = (event) => {
        log.info('WebSocket closed', { 
          code: event.code, 
          reason: event.reason,
          wasClean: event.wasClean 
        });

        isConnected = false;

        connectionError = 'Failed to connect. Please refresh the page.';
      };

    } catch (error) {
      log.error("Failed to create WebSocket", error);
      connectionError = "Failed to establish connection";
    }
  }

  function disconnectWebSocket() {
    if (ws) {
      log.info("Manually closing WebSocket connection");
      ws.close(1000, "User navigated away");
      ws = null;
    }
  }

  onMount(() => {
    log.info("Room component mounted", {
      roomID: data.room.id,
      userID: data.user?.id,
      participantCount: data.participants.length
    });

    connectWebSocket();
  })

  onDestroy(() => {
    log.info('Room component unmounting');
    disconnectWebSocket();
  });
</script>

<div class="min-h-screen bg-stone-100 p-8">
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Room Header with Connection Status -->
    <div class="p-8 bg-white rounded-lg shadow">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-3xl font-bold text-stone-700 mb-2">
            Room Chat
          </h1>
          <p class="text-sm text-stone-500">
            Room ID: {data.room.id}
          </p>
        </div>

        <!-- Connection Status Indicator -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 px-3 py-2 rounded-full {isConnected ? 'bg-green-100' : 'bg-red-100'}">
            <div class="w-3 h-3 rounded-full {isConnected 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-red-500'}">
            </div>
            <span class="text-sm font-medium {isConnected 
              ? 'text-green-700' 
              : 'text-red-700'}">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <!-- Connection Error -->
      {#if connectionError}
        <div class="rounded-md bg-yellow-300 p-4 border-yellow-200 border mb-4">
          <p class="text-sm text-yellow-800">{connectionError}</p>
        </div>
      {/if}

      <!-- Back to Home -->
      <a 
        href="/"
        class="inline-block text-blue-500 hover:text-blue-400 text-sm font-medium"
      >
        ← Back to Home
      </a>
    </div>

    <!-- Participants List -->
    <div class="p-8 bg-white rounded-lg shadow">
      <h2 class="text-xl font-bold text-stone-700 mb-4">
        Participants ({data.participants.length})
      </h2>
      
      <div class="space-y-2">
        {#each data.participants as participant}
          <div class="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <div>
              <p class="font-medium text-stone-700">
                {participant.user_id === data.user?.id ? 'You' : `User ${participant.user_id}`}
              </p>
              <p class="text-xs text-stone-500">
                Joined: {new Date(participant.joined_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Chat Area Placeholder -->
    <div class="p-8 bg-white rounded-lg shadow">
      <h2 class="text-xl font-bold text-stone-700 mb-4">
        Chat Area 
      </h2>
      
      {#if isConnected}
        <div class="text-center py-12 text-stone-500">
          <p class="text-lg mb-2">✅ WebSocket connected!</p>
          <p class="text-sm">Ready to send and receive messages</p>
        </div>
      {:else}
        <div class="text-center py-12 text-stone-500">
          <p class="text-lg mb-2">⏳ Connecting to chat...</p>
          <p class="text-sm">Please wait while we establish the connection</p>
        </div>
      {/if}
    </div>
  </div>
</div>
