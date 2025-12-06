<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { PageData } from "./$types";

  let {data}: {data: PageData} = $props();
  
  // WebSocket state
  let ws: WebSocket | null = $state(null);
  let isConnected = $state(false);
  let connectionError = $state<string | null>(null);

  // Voice messages state
  let messages = $state<any[]>([]);
  let isLoadingMessages = $state(false);

  // Upload state
  let selectedFile: File | null = $state(null);
  let isUploading = $state(false);
  let uploadError = $state<string | null>(null);
  let uploadSuccess = $state(false);

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
    });

    try {
      const wsUrl = `/api/ws?room_id=${data.room.id}&token=${data.accessToken}`;
      log.debug('Creating WebSocket connection', { url: wsUrl.replace(data.accessToken, 'TOKEN_HIDDEN') });

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        log.info("WebSocket connected successfully");
        isConnected = true;
        connectionError = null;
      }
      
      ws.onmessage = (event) => {
        log.debug('WebSocket message received', { data: event.data });
        try {
          const message = JSON.parse(event.data);
          log.info('Parsed message', { type: message.type, message });
          
          if (message.type === 'new_voice_message') {
            log.info('New voice message received', message.data);
            messages = [message.data, ...messages];
          } else if (message.type === 'pong') {
            log.debug('Received pong');
          }
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

    async function loadMessages() {
    isLoadingMessages = true;
    try {
      const response = await fetch(`/api/messages/room/${data.room.id}`, {
        headers: {
          'Authorization': `Bearer ${data.accessToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        messages = result.messages || [];
        log.info('Messages loaded', { count: messages.length });
      } else {
        log.error('Failed to load messages', { status: response.status });
      }
    } catch (error) {
      log.error('Error loading messages', error);
    } finally {
      isLoadingMessages = false;
    }
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Check file type
      if (!file.type.startsWith('audio/')) {
        uploadError = 'Please select an audio file';
        selectedFile = null;
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        uploadError = 'File size must be less than 5MB';
        selectedFile = null;
        return;
      }
      
      selectedFile = file;
      uploadError = null;
      uploadSuccess = false;
    }
  }

  function disconnectWebSocket() {
    if (ws) {
      log.info("Manually closing WebSocket connection");
      ws.close(1000, "User navigated away");
      ws = null;
    }
  }

  async function uploadVoiceMessage() {
    if (!selectedFile) return;

    isUploading = true;
    uploadError = null;
    uploadSuccess = false;

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('room_id', data.room.id);
      
      // Get audio duration (approximation - you might want to be more precise)
      const duration = Math.floor(Math.random() * 10) + 5; // Random 5-15 seconds for demo
      formData.append('duration_seconds', duration.toString());

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.accessToken}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        log.info('Voice message uploaded', result);
        uploadSuccess = true;
        selectedFile = null;
        
        // Clear the file input
        const fileInput = document.getElementById('audio-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Reload messages
        await loadMessages();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          uploadSuccess = false;
        }, 3000);
      } else {
        const error = await response.json();
        uploadError = error.error || 'Failed to upload voice message';
        log.error('Upload failed', { status: response.status, error });
      }
    } catch (error) {
      log.error('Upload error', error);
      uploadError = 'An error occurred while uploading';
    } finally {
      isUploading = false;
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  }

  onMount(() => {
    log.info("Room component mounted", {
      roomID: data.room.id,
      userID: data.user?.id,
      participantCount: data.participants.length
    });

    connectWebSocket();
    loadMessages();
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
        <div class="rounded-md bg-yellow-100 p-4 border-yellow-200 border mb-4">
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
                {participant.user_id === data.user?.id ? 'You' : `User ${participant.user_id.slice(0, 8)}`}
              </p>
              <p class="text-xs text-stone-500">
                Joined: {new Date(participant.joined_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Voice Message Upload -->
    <div class="p-8 bg-white rounded-lg shadow">
      <h2 class="text-xl font-bold text-stone-700 mb-4">
        Send Voice Message
      </h2>

      {#if uploadSuccess}
        <div class="rounded-md bg-green-100 p-4 border-green-200 border mb-4">
          <p class="text-sm text-green-800">Voice message uploaded successfully! 🎉</p>
        </div>
      {/if}

      {#if uploadError}
        <div class="rounded-md bg-red-100 p-4 border-red-200 border mb-4">
          <p class="text-sm text-red-800">{uploadError}</p>
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label for="audio-file" class="block text-sm font-medium text-stone-700 mb-2">
            Select Audio File
          </label>
          <input
            id="audio-file"
            type="file"
            accept="audio/*"
            onchange={handleFileSelect}
            class="block w-full text-sm text-stone-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              file:cursor-pointer cursor-pointer"
          />
          <p class="text-xs text-stone-500 mt-1">
            Max file size: 5MB. Supported formats: MP3, WAV, WebM, etc.
          </p>
        </div>

        {#if selectedFile}
          <div class="p-3 bg-stone-50 rounded-lg">
            <p class="text-sm text-stone-700">
              <span class="font-medium">Selected:</span> {selectedFile.name}
            </p>
            <p class="text-xs text-stone-500">
              Size: {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        {/if}

        <button
          onclick={uploadVoiceMessage}
          disabled={!selectedFile || isUploading}
          class="w-full rounded-md bg-blue-500 px-4 py-2 text-white font-medium hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isUploading ? 'Uploading...' : 'Upload Voice Message'}
        </button>
      </div>
    </div>

    <!-- Voice Messages List -->
    <div class="p-8 bg-white rounded-lg shadow">
      <h2 class="text-xl font-bold text-stone-700 mb-4">
        Voice Messages
      </h2>

      {#if isLoadingMessages}
        <div class="text-center py-8 text-stone-500">
          <p>Loading messages...</p>
        </div>
      {:else if messages.length === 0}
        <div class="text-center py-12 text-stone-500">
          <p class="text-lg mb-2">No voice messages yet</p>
          <p class="text-sm">Upload the first one to get started! 🎤</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each messages as message}
            <div class="border border-stone-200 rounded-lg p-4 {message.sender_id === data.user?.id ? 'bg-blue-50' : 'bg-stone-50'}">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <p class="text-sm font-medium text-stone-700">
                    {message.sender_id === data.user?.id ? 'You' : `User ${message.sender_id.slice(0, 8)}`}
                  </p>
                  <p class="text-xs text-stone-500">
                    {formatDate(message.created_at)}
                  </p>
                </div>
                <span class="text-xs bg-stone-200 text-stone-700 px-2 py-1 rounded">
                  {formatDuration(message.duration_seconds)}
                </span>
              </div>

              {#if message.url}
                <audio controls class="w-full mt-2">
                  <source src={message.url} type="audio/webm">
                  Your browser does not support the audio element.
                </audio>
              {:else}
                <p class="text-xs text-stone-500 italic">Audio file unavailable</p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
