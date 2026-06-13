<template>
  <div class="not-prose border rounded-lg p-6 bg-white dark:bg-neutral-900 shadow-sm mt-4">
    <h4 class="font-bold mb-4">Live Preview: Nested Form</h4>
    <form @submit="onSubmit" class="space-y-4 max-w-sm">
      <SafeField :errors="errors" name="name" v-slot="{ error }">
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input v-model="values.name" class="border p-2 w-full rounded dark:bg-neutral-800 dark:border-neutral-700" :class="{'border-red-500': error}" />
          <p class="text-red-500 text-xs mt-1" v-if="error">{{ error }}</p>
        </div>
      </SafeField>

      <div class="pl-4 border-l-2 border-gray-200 dark:border-neutral-700 space-y-4 mt-2">
        <h5 class="font-bold text-sm">Address</h5>
        <SafeField :errors="errors" name="address.street" v-slot="{ error }">
          <div>
            <label class="block text-xs font-medium mb-1">Street (min 5 chars)</label>
            <input v-model="values.address.street" class="border p-2 w-full rounded dark:bg-neutral-800 dark:border-neutral-700" :class="{'border-red-500': error}" />
            <p class="text-red-500 text-xs mt-1" v-if="error">{{ error }}</p>
          </div>
        </SafeField>
        <SafeField :errors="errors" name="address.city" v-slot="{ error }">
          <div>
            <label class="block text-xs font-medium mb-1">City</label>
            <input v-model="values.address.city" class="border p-2 w-full rounded dark:bg-neutral-800 dark:border-neutral-700" :class="{'border-red-500': error}" />
            <p class="text-red-500 text-xs mt-1" v-if="error">{{ error }}</p>
          </div>
        </SafeField>
      </div>
      
      <button type="submit" class="bg-primary text-white px-4 py-2 rounded">Submit</button>
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
  name: z.string().min(2),
  address: z.object({
    street: z.string().min(5),
    city: z.string().min(2)
  })
});

const { values, errors, handleSubmit } = useSafeForm(schema, {
  name: '',
  address: { street: '', city: '' }
});

const submittedData = ref(null);

const onSubmit = handleSubmit((data) => {
  submittedData.value = data as any;
});
</script>
