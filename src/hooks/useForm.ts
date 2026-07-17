/**
 * Type-safe form management hook
 */

import { useState, useCallback } from 'react';
import { FormState, ValidationRule } from '@/types';
import { handleValidationError, ValidationRules } from '@/utils/errors';

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void> | void;
}

/**
 * Custom hook for form state management with validation
 */
export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>,
) {
  const [values, setValues] = useState<T>(options.initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: keyof T, value: any) => {
      if (options.validate) {
        const validationErrors = options.validate({ ...values, [name]: value });
        return validationErrors[name] || '';
      }
      return '';
    },
    [values, options],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const fieldName = name as keyof T;
      const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [fieldName]: fieldValue,
      }));

      if (touched[fieldName]) {
        const error = validateField(fieldName, fieldValue);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error,
        }));
      }
    },
    [touched, validateField],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      const fieldName = name as keyof T;

      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }));

      const error = validateField(fieldName, values[fieldName]);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    },
    [values, validateField],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate all fields
      const newErrors: Partial<Record<keyof T, string>> = {};
      if (options.validate) {
        Object.assign(newErrors, options.validate(values));
      }

      setErrors(newErrors);
      setTouched(
        Object.keys(values).reduce(
          (acc, key) => {
            acc[key as keyof T] = true;
            return acc;
          },
          {} as Partial<Record<keyof T, boolean>>,
        ),
      );

      if (Object.keys(newErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        await options.onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, options],
  );

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(options.initialValues);
    setErrors({});
    setTouched({});
  }, [options.initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
  };
}

/**
 * Helper to create field props for input elements
 */
export function useField<T extends Record<string, any>>(
  form: ReturnType<typeof useForm<T>>,
  fieldName: keyof T,
) {
  return {
    name: fieldName,
    value: form.values[fieldName],
    onChange: form.handleChange,
    onBlur: form.handleBlur,
    error: form.errors[fieldName],
    touched: form.touched[fieldName],
  };
}

/**
 * Preset validators for common fields
 */
export const fieldValidators = {
  email: (value: string) => {
    if (!value) return 'Email is required';
    if (!ValidationRules.email.validate(value)) return 'Invalid email address';
    return '';
  },

  password: (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  },

  required: (fieldName: string) => (value: any) => {
    if (!value) return `${fieldName} is required`;
    return '';
  },

  minLength: (fieldName: string, min: number) => (value: string) => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return '';
  },

  maxLength: (fieldName: string, max: number) => (value: string) => {
    if (value && value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return '';
  },
};
