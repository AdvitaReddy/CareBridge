import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import useFormFeedback from '@/hooks/useFormFeedback';
import FormFeedbackMessage from '@/components/FormFeedbackMessage';

interface InviteModalProps {
  onClose: () => void;
}

export default function InviteModal({ onClose }: InviteModalProps) {
  const { inviteCircleMember } = useApp();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'family' | 'caregiver'>('family');
  const { isSaving, success, error, clear, run } = useFormFeedback();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const saved = await run(() => inviteCircleMember(email, role), 'Invitation sent');
    if (saved) setEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-dark/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-neutral-800">Invite Care Circle Member</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { clear(); setEmail(e.target.value); }}
              placeholder="e.g. priya@email.com"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              required
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => { clear(); setRole(e.target.value as 'family' | 'caregiver'); }}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              >
                <option value="family">Family</option>
                <option value="caregiver">Caregiver</option>
              </select>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isSaving}
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
              {isSaving ? 'Saving...' : 'Send Invite'}
            </button>
            <FormFeedbackMessage success={success} error={error} />
          </div>
        </form>
      </div>
    </div>
  );
}
