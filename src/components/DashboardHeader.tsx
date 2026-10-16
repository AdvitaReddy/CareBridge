import { LogOut, Heart } from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

export default function DashboardHeader({ title, subtitle, onBack }: DashboardHeaderProps) {
  return (
    <header className="bg-primary-100 dark:bg-surface-dark text-text-light dark:text-text-dark">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-primary text-primary-text hover:brightness-95 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading font-bold text-lg sm:text-xl">{title}</h1>
              {subtitle && <p className="text-text-muted-light dark:text-text-muted-dark text-xs sm:text-sm">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Heart className="w-6 h-6 text-secondary" fill="currentColor" />
            <span className="font-heading font-bold text-base hidden sm:block">CareBridge</span>
          </div>
        </div>
      </div>
    </header>
  );
}
