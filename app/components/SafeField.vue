<template>
  <div class="safe-field">
    <slot :error="errorMessage" />
    <div v-if="errorMessage && !hideError" class="text-red-500 text-sm mt-1">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue';
import type { FormErrors, Paths } from '../utils/formTypes';

const props = defineProps<{
  errors: FormErrors<T>;
  name: Paths<T>;
  hideError?: boolean;
}>();

const errorMessage = computed(() => {
  return (props.errors as any)[props.name] as string | undefined;
});
</script>
