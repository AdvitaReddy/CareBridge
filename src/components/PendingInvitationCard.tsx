import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function PendingInvitationCard() {
  const { circleInvitations, profile, userEmail, respondToCircleInvitation } = useApp();
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const invitations = circleInvitations.filter((invitation) => (
    invitation.status === 'pending'
    && userEmail
    && invitation.email.toLowerCase() === userEmail.toLowerCase()
  ));

  if (!profile || invitations.length === 0) return null;

  const respond = async (invitationId: string, accept: boolean) => {
    setWorkingId(invitationId);
    setError(null);
    try {
      await respondToCircleInvitation(invitationId, accept);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to respond to this invitation.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <section className="fixed bottom-6 left-6 z-40 w-[min(28rem,calc(100vw-3rem))] card p-4 shadow-xl" aria-label="Care circle invitations">
      <h2 className="font-display font-bold text-base text-neutral-800">Care Circle Invitation</h2>
      <p className="mt-1 text-sm text-neutral-600">
        You have {invitations.length === 1 ? 'an invitation' : `${invitations.length} invitations`} to join a care circle.
      </p>
      <div className="mt-3 space-y-3">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="rounded-xl bg-neutral-50 p-3">
            <p className="text-sm font-semibold text-neutral-800">
              Invited as {invitation.role}
            </p>
            <p className="mt-1 text-xs text-neutral-500">{invitation.email}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => void respond(invitation.id, true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Accept
              </button>
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => void respond(invitation.id, false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Decline
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-danger-600">{error}</p>}
    </section>
  );
}
