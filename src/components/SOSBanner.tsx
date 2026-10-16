import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Clock3, MapPin, Phone, UserRoundCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { familyMember, formatDateTime } from '@/data/mockData';
import Bridgey from '@/components/Bridgey';

function formatElapsed(startedAt: string, now: number) {
  const totalSeconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export default function SOSBanner() {
  const { activeSOS, profile, emergencyContact, acknowledgeSOS, resolveSOS } = useApp();
  const [now, setNow] = useState(Date.now());
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeSOSId = activeSOS?.id;

  useEffect(() => {
    if (!activeSOSId) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeSOSId]);

  if (!activeSOS) return null;

  const isEscalated = activeSOS.status === 'escalated';
  const isAcknowledged = activeSOS.status === 'acknowledged';
  const canAcknowledge = (profile?.role === 'family' || profile?.role === 'caregiver')
    && (activeSOS.status === 'active' || isEscalated);
  const canResolve = profile?.role === 'admin' || (isAcknowledged && profile?.id === activeSOS.acknowledgedBy);
  const hasLocation = activeSOS.latitude !== null && activeSOS.longitude !== null;
  const emergencyPhone = emergencyContact.phone || familyMember.phone;
  const emergencyName = emergencyContact.name || 'Emergency contact';
  const mapUrl = hasLocation
    ? `https://www.google.com/maps?q=${activeSOS.latitude},${activeSOS.longitude}`
    : null;

  const runAction = async (action: () => Promise<void>) => {
    setWorking(true);
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update the SOS.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="bg-danger text-danger-text rounded-2xl shadow-lg overflow-hidden animate-slide-in-right" aria-live="polite">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-lg sm:text-xl">SOS Emergency Alert</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/25 text-xs font-bold uppercase">{activeSOS.status}</span>
            </div>
            <p className="text-danger-text/90 text-sm mt-1">
              {activeSOS.triggeredBy} triggered an SOS at {formatDateTime(activeSOS.timestamp)}.
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold tabular-nums">
              <Clock3 className="h-4 w-4" /> Elapsed {formatElapsed(activeSOS.timestamp, now)}
            </p>
          </div>
        </div>

        {isEscalated && (
          <div className="rounded-xl border border-white/30 bg-white/15 p-4">
            <p className="font-bold">No response, escalated</p>
            <p className="mt-1 text-sm">Call the emergency contact or 112 now.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${emergencyPhone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-danger-700">
                <Phone className="h-4 w-4" /> {emergencyName} · {emergencyPhone}
              </a>
              <a href="tel:112" className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-danger-700">
                <Phone className="h-4 w-4" /> Call 112
              </a>
            </div>
          </div>
        )}

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {mapUrl ? <a className="underline underline-offset-2" href={mapUrl} target="_blank" rel="noreferrer">Open SOS location in map</a> : <span>Location unavailable</span>}
          </p>
          <p className="flex items-start gap-2">
            <UserRoundCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{activeSOS.notifiedMembers.length ? `Notified: ${activeSOS.notifiedMembers.join(', ')}` : 'Care circle members and admin notified'}</span>
          </p>
        </div>

        <div className="sos-bridgey-row">
          <Bridgey expression="concerned" size="md" floating={false} interactive={false} showTips={false} />
          <div className="flex-1">
            {isAcknowledged ? (
              <p className="text-sm font-semibold text-danger-text/95">
                {activeSOS.responderName ?? 'A care circle member'} acknowledged. Help is on the way.
              </p>
            ) : isEscalated ? (
              <p className="text-sm text-danger-text/90">The care circle has not acknowledged yet.</p>
            ) : (
              <p className="text-sm text-danger-text/90">Waiting for acknowledgment.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {canAcknowledge && (
                <button
                  type="button"
                  disabled={working}
                  onClick={() => void runAction(() => acknowledgeSOS(activeSOS.id))}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-danger-700 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" /> Acknowledge
                </button>
              )}
              {canResolve && (
                <button
                  type="button"
                  disabled={working}
                  onClick={() => void runAction(() => resolveSOS(activeSOS.id))}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/30 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" /> Mark as resolved
                </button>
              )}
            </div>
            {error && <p role="alert" className="mt-2 text-sm font-semibold">{error}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}