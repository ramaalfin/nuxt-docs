<template>
  <div class="not-prose border rounded-lg p-6 bg-white dark:bg-neutral-900 shadow-sm mt-4">
    <h4 class="font-bold mb-4">Live Preview: Basic Form</h4>
    <form @submit="onSubmit" class="space-y-4 max-w-sm">
      <SafeField :errors="errors" name="email" v-slot="{ error }">
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input v-model="values.email" class="border p-2 w-full rounded dark:bg-neutral-800 dark:border-neutral-700" :class="{'border-red-500': error}" />
          <p class="text-red-500 text-xs mt-1" v-if="error">{{ error }}</p>
        </div>
      </SafeField>
      
      <SafeField :errors="errors" name="password" v-slot="{ error }">
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <input type="password" v-model="values.password" class="border p-2 w-full rounded dark:bg-neutral-800 dark:border-neutral-700" :class="{'border-red-500': error}" />
          <p class="text-red-500 text-xs mt-1" v-if="error">{{ error }}</p>
        </div>
      </SafeField>
      
      <button type="submit" class="bg-primary text-white px-4 py-2 rounded">Login</button>
    </form>
    
    <div v-if="submittedData" class="mt-4 p-3 bg-green-50 text-green-700 rounded text-sm">
      Success: <pre>{{ submittedData }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import { ref } from 'vue';
import { useSafeForm } from '../../composables/useSafeForm';
import SafeField from '../SafeField.vue';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const { values, errors, handleSubmit } = useSafeForm(schema, {
  email: '',
  password: ''
});

const submittedData = ref(null);

const onSubmit = handleSubmit((data) => {
  submittedData.value = data as any;
});
</script>
