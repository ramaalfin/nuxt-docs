<template>
  <div class="not-prose border rounded-lg p-6 bg-white dark:bg-neutral-900 shadow-sm mt-4">
    <h4 class="font-bold mb-4">Live Preview: Array Form</h4>
    <form @submit="onSubmit" class="space-y-4 max-w-sm">
      
      <div class="space-y-2">
        <label class="block text-sm font-medium">Tags (min 3 chars)</label>
        <div v-for="(tag, i) in values.tags" :key="i" class="flex gap-2">
          <SafeField :errors="errors" :name="`tags.${i}` as any" v-slot="{ error }">
            <div class="flex-1">
              <input v-model="values.tags[i]" class="border p-2 w-full rounded dark:bg-neutral-800 dark:border-neutral-700" :class="{'border-red-500': error}" />
              <p class="text-red-500 text-xs mt-1" v-if="error">{{ error }}</p>
            </div>
          </SafeField>
          <button type="button" @click="values.tags.splice(i, 1)" class="bg-red-500 text-white px-3 rounded h-10">X</button>
        </div>
      </div>
      
      <div>
        <button type="button" @click="values.tags.push('')" class="bg-gray-200 dark:bg-neutral-800 px-4 py-2 rounded text-sm mb-2">Add Tag</button>
        <SafeField :errors="errors" name="tags" v-slot="{ error }">
           <p class="text-red-500 text-xs mt-1" v-if="error">{{ error }}</p>
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
  tags: z.array(z.string().min(3)).min(1, 'You must provide at least one tag')
});

const { values, errors, handleSubmit } = useSafeForm(schema, {
  tags: ['Vue']
});

const submittedData = ref(null);

const onSubmit = handleSubmit((data) => {
  submittedData.value = data as any;
});
</script>
