<template>
  <div class="not-prose border rounded-lg p-6 bg-white dark:bg-neutral-900 shadow-sm mt-4">
    <h4 class="font-bold mb-4">Live Preview: POST Request with Body Validation</h4>
    <div class="space-y-4 max-w-sm">
      <div class="flex flex-col">
        <label class="text-xs text-gray-500">Name (min 2 chars)</label>
        <input v-model="form.name" class="border p-2 rounded dark:bg-neutral-800 dark:border-neutral-700" />
      </div>
      <div class="flex flex-col">
        <label class="text-xs text-gray-500">Email</label>
        <input v-model="form.email" type="email" class="border p-2 rounded dark:bg-neutral-800 dark:border-neutral-700" />
      </div>
      <button @click="createUser" :disabled="loading" class="bg-primary text-white px-4 py-2 rounded">
        {{ loading ? 'Creating...' : 'Create User' }}
      </button>
    </div>
    
    <div v-if="result" class="mt-4 p-4 rounded text-sm overflow-auto" :class="result.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'">
      <h5 class="font-bold mb-2">{{ result.ok ? 'Success:' : 'Zod Client-Side Error:' }}</h5>
      <pre>{{ result.ok ? result.data : result.error.message }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ApiClient } from '../../../utils/api-client/client';
import { ApiRegistry } from '../../../utils/api-client/registry';

const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
  await new Promise(r => setTimeout(r, 500));
  return new Response(JSON.stringify({ id: Math.floor(Math.random() * 100), success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  fetch: mockFetch as any
});

const form = reactive({
  name: '',
  email: ''
});
const loading = ref(false);
const result = ref<any>(null);

const createUser = async () => {
  loading.value = true;
  // TypeScript enforces that `body` matches Zod schema!
  result.value = await client.request(ApiRegistry.createUser, {
    params: undefined,
    body: { name: form.name, email: form.email }
  });
  loading.value = false;
};
</script>
