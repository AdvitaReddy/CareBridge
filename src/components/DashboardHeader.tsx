import { ArrowLeft, Heart } from 'lucide-react';
import type { Role } from '@/data/mockData';

interface DashboardHeaderProps {
  role: Role;
  title: string;
  subtitle?: string;
  onBack: () => void;
}

const roleColors: Record<Role, string> = {
  elderly: 'from-primary-500 to-secondary-500',
  family: 'from-primary-600 to-primary-500',
  caregiver: 'from-secondary-600 to-secondary-500',
  admin: 'from-neutral-700 to-neutral-600',
};

export default function DashboardHeader({ role, title, subtitle, onBack }: DashboardHeaderProps) {
  return (
    <header className={`bg-gradient-to-r ${roleColors[role]} text-white`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
              aria-label="Back to role selection"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display font-bold text-lg sm:text-xl">{title}</h1>
              {subtitle && <p className="text-white/70 text-xs sm:text-sm">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-white/80" fill="currentColor" />
            <span className="font-display font-bold text-base hidden sm:block">CareBridge</span>
          </div>
        </div>
      </div>
    </header>
  );
}
