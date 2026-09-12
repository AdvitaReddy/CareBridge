import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDateTime } from '@/data/mockData';
import Bridgey from '@/components/Bridgey';

interface SOSBannerProps {
  onResolve?: () => void;
  canResolve?: boolean;
}

export default function SOSBanner({ onResolve, canResolve = true }: SOSBannerProps) {
  const { activeSOS, bridgeyEvent, resolveSOS } = useApp();
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    if (bridgeyEvent?.type !== 'sos-resolved') return;
    setShowResolved(true);
    const timer = window.setTimeout(() => setShowResolved(false), 5000);
    return () => window.clearTimeout(timer);
  }, [bridgeyEvent]);

  if (!activeSOS && !showResolved) {
    return null;
  }

  if (!activeSOS && showResolved) {
    return (
      <div className="bg-success text-success-text rounded-2xl shadow-lg overflow-hidden animate-slide-in-right">
        <div className="flex flex-col items-center gap-2 p-4 sm:p-5 text-center">
          <Bridgey expression="relieved" size="md" floating={false} interactive={false} showTips={false} />
          <h3 className="font-display font-bold text-lg sm:text-xl">So glad everything&apos;s okay now 💛</h3>
          <p className="text-success-text/90 text-sm">The SOS has been resolved and the care circle is up to date.</p>
        </div>
      </div>
    );
  }

  if (!activeSOS) return null;

  const handleResolve = () => {
    if (!activeSOS) return;
    resolveSOS(activeSOS.id, 'Ravi Rao');
    onResolve?.();
  };

  return (
    <div className="bg-danger text-danger-text rounded-2xl shadow-lg overflow-hidden animate-slide-in-right">
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg sm:text-xl">SOS Emergency Alert</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/25 text-xs font-bold uppercase tracking-wide">Active</span>
            </div>
            <p className="text-danger-text/90 text-sm mt-1">
              Venkat Rao triggered an SOS at {formatDateTime(activeSOS.timestamp)}.
              Immediate attention required.
            </p>
          </div>
        </div>
        <div className="sos-bridgey-row">
          <Bridgey expression="concerned" size="md" floating={false} interactive={false} showTips={false} />
          {canResolve && (
            <div className="flex-1">
              <p className="text-sm text-danger-text/90 mb-2">Bridgey is here with you while the care circle responds.</p>
              <button onClick={handleResolve} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-light text-danger font-semibold text-sm hover:bg-danger-50 transition-colors active:scale-95">
                <X className="w-4 h-4" /> Mark as Resolved
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
