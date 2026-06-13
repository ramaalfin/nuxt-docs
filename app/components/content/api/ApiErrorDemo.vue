<template>
  <div class="not-prose border rounded-lg p-6 bg-white dark:bg-neutral-900 shadow-sm mt-4">
    <h4 class="font-bold mb-4">Live Preview: Retries & Error Handling</h4>
    <div class="space-y-4 max-w-sm">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        This endpoint is configured to retry up to 3 times automatically via exponential backoff.
      </p>
      
      <button @click="triggerError" :disabled="loading" class="bg-primary text-white px-4 py-2 rounded mt-2">
        {{ loading ? `Attempting... (Watch console or wait)` : 'Trigger Flaky Request' }}
      </button>
    </div>
    
    <div v-if="result" class="mt-4 p-4 rounded text-sm overflow-auto" :class="result.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'">
      <h5 class="font-bold mb-2">{{ result.ok ? 'Success (After Retries):' : 'Exhausted Retries. Final Error:' }}</h5>
      <pre>{{ result.ok ? result.data : result.error.message }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ApiClient } from '../../../utils/api-client/client';
import { ApiRegistry } from '../../../utils/api-client/registry';

let attempts = 0;

const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
  attempts++;
  
  // Fail twice, succeed on third attempt
  if (attempts < 3) {
    throw new Error('Network timeout (simulated)');
  }

  return new Response(JSON.stringify({ message: 'Success! Server finally responded.' }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  fetch: mockFetch as any
});

const loading = ref(false);
const result = ref<any>(null);

const triggerError = async () => {
  attempts = 0; // Reset counter for demo
  loading.value = true;
  result.value = null;
  
  result.value = await client.request(ApiRegistry.flakyEndpoint, {
    params: undefined
  });
  
  loading.value = false;
};
</script>
