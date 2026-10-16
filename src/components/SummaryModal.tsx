import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import useFormFeedback from '@/hooks/useFormFeedback';
import FormFeedbackMessage from '@/components/FormFeedbackMessage';

interface SummaryModalProps {
  appointmentId: string;
  doctorName: string;
  onClose: () => void;
}

export default function SummaryModal({ appointmentId, doctorName, onClose }: SummaryModalProps) {
  const { addAppointmentSummary } = useApp();
  const [summary, setSummary] = useState('');
  const { isSaving, success, error, clear, run } = useFormFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    const saved = await run(() => addAppointmentSummary(appointmentId, summary.trim()), 'Saved');
    if (saved) setSummary('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-dark/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-lg text-neutral-800">Post-Visit Summary</h2>
            <p className="text-sm text-neutral-500 mt-0.5">{doctorName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            value={summary}
            onChange={(e) => { clear(); setSummary(e.target.value); }}
            placeholder="Enter notes from the doctor visit..."
            rows={5}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
            autoFocus
          />
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 btn-primary px-4 py-2.5 disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save Summary'}
            </button>
            <FormFeedbackMessage success={success} error={error} />
          </div>
        </form>
      </div>
    </div>
  );
}
