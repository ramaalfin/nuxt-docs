import { reactive, ref, toRaw } from 'vue';
import type { z } from 'zod';
import type { FormErrors, Paths } from '../utils/formTypes';

// Helper to format zod errors into our flat FormErrors map
function formatZodErrors<T>(error: z.ZodError): FormErrors<T> {
  const formattedErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    // Keep only the first error for each path
    if (!formattedErrors[path]) {
      formattedErrors[path] = issue.message;
    }
  }
  return formattedErrors as FormErrors<T>;
}

export function useSafeForm<Schema extends z.ZodTypeAny>(
  schema: Schema,
  initialValues: Partial<z.infer<Schema>> = {}
) {
  type FormType = z.infer<Schema>;
  
  // State
  // We use structuredClone to ensure we don't accidentally mutate the initialValues reference
  // Fallback to JSON.parse(JSON.stringify) for environments without structuredClone, though modern ones have it
  const values = reactive(
    typeof structuredClone !== 'undefined' 
      ? structuredClone(toRaw(initialValues)) 
      : JSON.parse(JSON.stringify(toRaw(initialValues)))
  ) as FormType;
  
  const errors = reactive({}) as FormErrors<FormType>;
  const isSubmitting = ref(false);

  // Validate the current values
  async function validate(): Promise<boolean> {
    // Clear previous errors
    for (const key of Object.keys(errors)) {
      delete (errors as any)[key];
    }
    
    const result = await schema.safeParseAsync(values);
    if (!result.success) {
      const newErrors = formatZodErrors<FormType>(result.error);
      Object.assign(errors, newErrors);
      return false;
    }
    return true;
  }

  // Clear specific error
  function clearError(path: Paths<FormType>) {
    delete (errors as any)[path];
  }

  // Set specific error
  function setError(path: Paths<FormType>, message: string) {
    (errors as any)[path] = message;
  }

  // Submit wrapper
  function handleSubmit(
    onSuccess: (data: FormType) => void | Promise<void>,
    onError?: (errors: FormErrors<FormType>) => void | Promise<void>
  ) {
    return async (e?: Event) => {
      if (e && e.preventDefault) e.preventDefault();
      
      isSubmitting.value = true;
      const isValid = await validate();
      
      if (isValid) {
        // Pass the strictly validated and transformed data to the success handler
        const result = await schema.safeParseAsync(values);
        if (result.success) {
           await onSuccess(result.data);
        }
      } else if (onError) {
        await onError(errors as FormErrors<FormType>);
      }
      
      isSubmitting.value = false;
    };
  }

  return {
    values,
    errors,
    isSubmitting,
    validate,
    clearError,
    setError,
    handleSubmit
  };
}
