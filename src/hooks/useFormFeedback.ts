import { useCallback, useEffect, useRef, useState } from 'react';

interface FormFeedback {
  isSaving: boolean;
  success: string | null;
  error: string | null;
  clear: () => void;
  run: (action: () => void | Promise<void>, successMessage?: string) => Promise<boolean>;
}

export default function useFormFeedback(): FormFeedback {
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const successTimer = useRef<number | null>(null);

  const clear = useCallback(() => {
    setSuccess(null);
    setError(null);
    if (successTimer.current !== null) {
      window.clearTimeout(successTimer.current);
      successTimer.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (successTimer.current !== null) window.clearTimeout(successTimer.current);
  }, []);

  const run = useCallback(async (action: () => void | Promise<void>, successMessage = 'Saved') => {
    clear();
    setIsSaving(true);
    try {
      await action();
      setSuccess(successMessage);
      window.dispatchEvent(new CustomEvent('carebridge:form-toast', { detail: successMessage }));
      successTimer.current = window.setTimeout(() => {
        setSuccess(null);
        successTimer.current = null;
      }, 3000);
      return true;
    } catch (cause) {
      const message = cause instanceof Error
        ? cause.message
        : typeof cause === 'object' && cause !== null && 'message' in cause && typeof cause.message === 'string'
          ? cause.message
          : 'Unable to save your changes.';
      setError(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [clear]);

  return { isSaving, success, error, clear, run };
}
