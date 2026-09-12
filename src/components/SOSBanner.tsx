import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatDateTime } from '@/data/mockData';

interface SOSBannerProps {
  onResolve?: () => void;
  canResolve?: boolean;
}

export default function SOSBanner({ onResolve, canResolve = true }: SOSBannerProps) {
  const { activeSOS, resolveSOS } = useApp();

  if (!activeSOS) return null;

  const handleResolve = () => {
    resolveSOS(activeSOS.id, 'Ravi Rao');
    onResolve?.();
  };

  return (
    <div className="bg-danger-600 text-white rounded-2xl shadow-lg overflow-hidden animate-slide-in-right">
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-lg sm:text-xl">SOS Emergency Alert</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/25 text-xs font-bold uppercase tracking-wide animate-pulse">
              Active
            </span>
          </div>
          <p className="text-danger-50 text-sm mt-1">
            Venkat Rao triggered an SOS at {formatDateTime(activeSOS.timestamp)}.
            Immediate attention required.
          </p>
          {canResolve && (
            <button
              onClick={handleResolve}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-danger-700 font-semibold text-sm hover:bg-danger-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Mark as Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
