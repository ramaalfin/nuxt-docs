<template>
  <div class="not-prose border rounded-lg p-6 bg-white dark:bg-neutral-900 shadow-sm mt-4">
    <h4 class="font-bold mb-4">Live Preview: Basic GET Request</h4>
    <div class="flex gap-4 items-center mb-2">
      <div class="flex flex-col">
        <label class="text-xs text-gray-500">User ID</label>
        <input v-model="userId" type="number" class="border p-2 rounded dark:bg-neutral-800 dark:border-neutral-700 w-24" />
      </div>
      <button @click="fetchUser" :disabled="loading" class="bg-primary text-white px-4 py-2 rounded mt-4">
        {{ loading ? 'Loading...' : 'Fetch User' }}
      </button>
    </div>
    <p class="text-xs text-gray-500 mb-4">Note: IDs > 10 will return a 404 error.</p>
    
    <div v-if="result" class="p-4 rounded text-sm overflow-auto" :class="result.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'">
      <h5 class="font-bold mb-2">{{ result.ok ? 'Success (Typed Response):' : 'Error:' }}</h5>
      <pre>{{ result.ok ? result.data : result.error.message }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ApiClient } from '../../../utils/api-client/client';
import { ApiRegistry } from '../../../utils/api-client/registry';

// Mock fetch for documentation purposes
const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
  const urlStr = url.toString();
  await new Promise(r => setTimeout(r, 500)); // Simulate delay
  
  if (urlStr.includes('/users/')) {
    const id = parseInt(urlStr.split('/').pop() || '1');
    if (id > 10) return new Response('Not Found', { status: 404, statusText: 'Not Found' });
    return new Response(JSON.stringify({ id, name: `User ${id}`, email: `user${id}@example.com` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response('Not Found', { status: 404 });
};

const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  fetch: mockFetch as any
});

const userId = ref(1);
const loading = ref(false);
const result = ref<any>(null);

const fetchUser = async () => {
  loading.value = true;
  result.value = await client.request(ApiRegistry.getUser, {
    params: { id: userId.value }
  });
  loading.value = false;
};
</script>
