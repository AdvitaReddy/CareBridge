import { CheckCircle2 } from 'lucide-react';

interface FormFeedbackMessageProps {
  success: string | null;
  error: string | null;
  noChanges?: boolean;
}

export default function FormFeedbackMessage({ success, error, noChanges = false }: FormFeedbackMessageProps) {
  if (error) return <p role="alert" className="text-sm text-danger-600">{error}</p>;
  if (success) {
    return (
      <p role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-success-700">
        <CheckCircle2 className="h-4 w-4" /> {success}
      </p>
    );
  }
  if (noChanges) return <p className="text-sm text-neutral-500">No changes</p>;
  return null;
}
