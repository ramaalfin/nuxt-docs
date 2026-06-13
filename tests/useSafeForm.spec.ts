import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { useSafeForm } from '../app/composables/useSafeForm';

describe('useSafeForm', () => {
  it('should initialize with values', () => {
    const schema = z.object({ name: z.string() });
    const { values } = useSafeForm(schema, { name: 'Test' });
    
    expect(values.name).toBe('Test');
    expectTypeOf(values.name).toBeString();
  });

  it('should validate basic fields correctly', async () => {
    const schema = z.object({ age: z.number().min(18) });
    const form = useSafeForm(schema, { age: 10 });
    
    const isValid = await form.validate();
    expect(isValid).toBe(false);
    expect(form.errors['age']).toBeDefined();
    
    form.values.age = 20;
    const isValidNow = await form.validate();
    expect(isValidNow).toBe(true);
    expect(form.errors['age']).toBeUndefined();
  });

  it('should format nested errors with dot notation', async () => {
    const schema = z.object({
      address: z.object({
        city: z.string().min(1, 'City required')
      })
    });
    
    const form = useSafeForm(schema, { address: { city: '' } });
    await form.validate();
    
    // The error should be at 'address.city'
    expect(form.errors['address.city']).toBe('City required');
    // Type checking the error paths
    expectTypeOf(form.errors).toEqualTypeOf<Partial<Record<"address" | "address.city", string>>>();
  });

  it('should handle array error paths correctly', async () => {
    const schema = z.object({
      tags: z.array(z.string().min(2, 'Too short'))
    });
    
    const form = useSafeForm(schema, { tags: ['a', 'valid'] });
    await form.validate();
    
    // Error on the first tag (index 0)
    expect(form.errors['tags.0']).toBe('Too short');
    expect(form.errors['tags.1']).toBeUndefined();
  });

  it('should support manual error setting and clearing', () => {
    const schema = z.object({ username: z.string() });
    const form = useSafeForm(schema, { username: '' });
    
    form.setError('username', 'Already taken');
    expect(form.errors['username']).toBe('Already taken');
    
    form.clearError('username');
    expect(form.errors['username']).toBeUndefined();
  });

  it('handleSubmit should intercept invalid submissions', async () => {
    const schema = z.object({ email: z.string().email() });
    const form = useSafeForm(schema, { email: 'invalid' });
    
    let successCalled = false;
    let errorCalled = false;
    
    const submit = form.handleSubmit(
      () => { successCalled = true; },
      () => { errorCalled = true; }
    );
    
    await submit();
    
    expect(successCalled).toBe(false);
    expect(errorCalled).toBe(true);
    expect(form.errors['email']).toBeDefined();
  });

  it('handleSubmit should call success on valid submission', async () => {
    const schema = z.object({ email: z.string().email() });
    const form = useSafeForm(schema, { email: 'test@example.com' });
    
    let successData: any = null;
    
    const submit = form.handleSubmit((data) => {
      successData = data;
    });
    
    await submit();
    
    expect(successData).toEqual({ email: 'test@example.com' });
    expectTypeOf(successData).toEqualTypeOf<{ email: string }>();
  });
});
