<template>
  <div class="not-prose border rounded-lg p-6 bg-white dark:bg-neutral-900 shadow-sm mt-4">
    <h4 class="font-bold mb-4">Live Preview: Custom Input</h4>
    <form @submit="onSubmit" class="space-y-4 max-w-sm">
      
      <SafeField :errors="errors" name="phone" v-slot="{ error }">
        <div class="custom-phone-wrapper">
          <label class="block text-sm font-medium mb-1">Phone Number (Must be 10 digits)</label>
          <input 
            v-model="values.phone" 
            placeholder="(###) ###-####"
            class="border p-2 w-full rounded dark:bg-neutral-800 dark:border-neutral-700"
            :class="{'border-red-500': error}"
          />
          <p class="text-red-500 text-xs mt-1" v-if="error">{{ error }}</p>
        </div>
      </SafeField>

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
  phone: z.string().length(10, 'Phone must be exactly 10 digits')
});

const { values, errors, handleSubmit } = useSafeForm(schema, {
  phone: ''
});

const submittedData = ref(null);

const onSubmit = handleSubmit((data) => {
  submittedData.value = data as any;
});
</script>
