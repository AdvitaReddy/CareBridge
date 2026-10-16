import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function FormToastHost() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: number | null = null;
    const showToast = (event: Event) => {
      const toastEvent = event as CustomEvent<string>;
      setMessage(toastEvent.detail);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setMessage(null);
        timeoutId = null;
      }, 3000);
    };
    window.addEventListener('carebridge:form-toast', showToast);
    return () => {
      window.removeEventListener('carebridge:form-toast', showToast);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!message) return null;
  return (
    <div role="status" className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-xl bg-success-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      {message}
    </div>
  );
}
