import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Bridgey from '@/components/Bridgey';

interface SOSCountdownModalProps {
  onClose: () => void;
  onTriggered: (locationUnavailable: boolean) => void;
}

export default function SOSCountdownModal({ onClose, onTriggered }: SOSCountdownModalProps) {
  const { sosCancelSeconds, triggerSOS, cancelSOSCountdown } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(sosCancelSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0 || submitting) return;
    const timer = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, submitting]);

  useEffect(() => {
    if (secondsLeft > 0 || startedRef.current) return;
    startedRef.current = true;
    setSubmitting(true);

    const submitSOS = async (latitude: number | null, longitude: number | null) => {
      const locationUnavailable = latitude === null || longitude === null;
      try {
        await triggerSOS({ latitude, longitude });
        onTriggered(locationUnavailable);
        onClose();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Unable to send the SOS.');
        setSubmitting(false);
        startedRef.current = false;
      }
    };

    if (!navigator.geolocation) {
      void submitSOS(null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => void submitSOS(position.coords.latitude, position.coords.longitude),
      () => void submitSOS(null, null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  }, [secondsLeft, triggerSOS, onClose, onTriggered]);

  const handleCancel = async () => {
    setError(null);
    try {
      await cancelSOSCountdown();
      onClose();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Unable to record the cancellation.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid min-h-screen place-items-center overflow-y-auto bg-danger-700 px-5 py-8 text-white" role="alertdialog" aria-modal="true" aria-labelledby="sos-countdown-title">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <Bridgey expression="concerned" size="md" floating={false} interactive={false} showTips={false} />
        </div>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <p className="text-sm font-bold uppercase">Emergency SOS</p>
        <h2 id="sos-countdown-title" className="mt-2 font-display text-3xl font-bold">
          {submitting ? 'Sending your alert' : 'Sending SOS in'}
        </h2>
        <div className="my-5 flex min-h-28 items-center justify-center" aria-live="assertive">
          {submitting ? (
            <LoaderCircle className="h-14 w-14 animate-spin" aria-label="Sending SOS" />
          ) : (
            <span className="font-display text-8xl font-bold tabular-nums">{secondsLeft}</span>
          )}
        </div>
        <p className="mx-auto max-w-sm text-lg text-white/90">
          {submitting ? 'Requesting your location and notifying your care circle.' : 'Your care circle will be alerted when the countdown ends.'}
        </p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-white/15 px-4 py-3 text-sm">{error}</p>}
        <button
          type="button"
          onClick={() => void handleCancel()}
          disabled={submitting}
          className="mt-8 min-h-16 w-full rounded-xl bg-white px-6 py-4 text-xl font-bold text-danger-700 shadow-lg transition hover:bg-danger-50 disabled:cursor-wait disabled:opacity-60"
        >
          Cancel SOS
        </button>
      </div>
    </div>
  );
}
