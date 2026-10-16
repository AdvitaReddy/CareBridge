import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Bridgey from '@/components/Bridgey';
import { useApp } from '@/context/AppContext';

export default function SOSResolutionNotice() {
  const { bridgeyEvent } = useApp();
  const lastEventId = useRef(
    bridgeyEvent?.type === 'sos-resolved' ? bridgeyEvent.id : null
  );
  const [visibleEventId, setVisibleEventId] = useState<string | null>(null);

  useEffect(() => {
    if (bridgeyEvent?.type !== 'sos-resolved' || bridgeyEvent.id === lastEventId.current) return;
    lastEventId.current = bridgeyEvent.id;
    setVisibleEventId(bridgeyEvent.id);
  }, [bridgeyEvent]);

  useEffect(() => {
    if (!visibleEventId) return;
    const timer = window.setTimeout(() => setVisibleEventId(null), 6000);
    return () => window.clearTimeout(timer);
  }, [visibleEventId]);

  if (!visibleEventId) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[min(28rem,calc(100vw-3rem))] bg-success text-success-text rounded-2xl shadow-lg overflow-hidden animate-slide-in-right"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex flex-col items-center gap-2 p-4 sm:p-5 text-center">
        <button
          type="button"
          onClick={() => setVisibleEventId(null)}
          className="absolute right-3 top-3 rounded-lg p-1 hover:bg-white/20"
          aria-label="Close SOS resolved message"
        >
          <X className="h-5 w-5" />
        </button>
        <Bridgey expression="relieved" size="md" floating={false} interactive={false} showTips={false} />
        <h3 className="font-display font-bold text-lg sm:text-xl">SOS resolved. So glad everything&apos;s okay now</h3>
        <p className="text-success-text/90 text-sm">The SOS has been resolved and the care circle is up to date.</p>
      </div>
    </div>
  );
}
