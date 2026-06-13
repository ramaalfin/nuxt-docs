<template>
  <div class="not-prose border rounded-lg p-6 bg-white dark:bg-neutral-900 shadow-sm mt-4">
    <h4 class="font-bold mb-4">Live Preview: Interceptors & Auth Headers</h4>
    <div class="space-y-4 max-w-sm">
      <div class="flex items-center gap-2">
        <input type="checkbox" v-model="isAuthenticated" id="authCheck" />
        <label for="authCheck" class="text-sm">Mock Logged In (Sends Token)</label>
      </div>
      
      <button @click="searchPosts" :disabled="loading" class="bg-primary text-white px-4 py-2 rounded mt-2">
        {{ loading ? 'Searching...' : 'Search Posts (Requires Auth)' }}
      </button>
    </div>
    
    <div v-if="result" class="mt-4 p-4 rounded text-sm overflow-auto" :class="result.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'">
      <h5 class="font-bold mb-2">{{ result.ok ? 'Success:' : 'Error:' }}</h5>
      <pre>{{ result.ok ? result.data : result.error.message }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ApiClient } from '../../../utils/api-client/client';
import { ApiRegistry } from '../../../utils/api-client/registry';

const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
  await new Promise(r => setTimeout(r, 400));
  
  // Verify token
  const headers = new Headers(init?.headers);
  if (headers.get('Authorization') !== 'Bearer my-secret-token') {
    return new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  }

  return new Response(JSON.stringify([
    { id: 1, title: 'Secret Post 1' },
    { id: 2, title: 'Secret Post 2' }
  ]), {
    headers: { 'Content-Type': 'application/json' }
  });
};

const isAuthenticated = ref(false);

const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  fetch: mockFetch as any,
  onRequest: (req) => {
    if (isAuthenticated.value) {
      req.headers = {
        ...req.headers,
        Authorization: 'Bearer my-secret-token'
      };
    }
    return req;
  }
});

const loading = ref(false);
const result = ref<any>(null);

const searchPosts = async () => {
  loading.value = true;
  result.value = await client.request(ApiRegistry.searchPosts, {
    params: undefined,
    query: { q: 'secret' }
  });
  loading.value = false;
};
</script>
