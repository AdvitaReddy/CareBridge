import { ArrowLeft, Heart, LayoutDashboard, Users, Calendar, Pill, AlertTriangle, ShieldCheck, CheckSquare, BarChart3 } from 'lucide-react';
import type { Role } from '@/data/mockData';

interface DashboardHeaderProps {
  role: Role;
  title: string;
  subtitle?: string;
  onBack: () => void;
}

const roleNav: Record<Role, { label: string; icon: typeof LayoutDashboard }[]> = {
  elderly: [],
  family: [
    { label: 'Timeline', icon: LayoutDashboard }, { label: 'Medicines', icon: Pill },
    { label: 'Appointments', icon: Calendar }, { label: 'Care Circle', icon: Users }, { label: 'SOS History', icon: AlertTriangle },
  ],
  caregiver: [
    { label: 'My Tasks', icon: CheckSquare }, { label: "Today's Schedule", icon: Calendar }, { label: 'Alerts', icon: AlertTriangle },
  ],
  admin: [
    { label: 'Statistics', icon: BarChart3 }, { label: 'Users', icon: Users }, { label: 'Verification', icon: ShieldCheck },
  ],
};

export default function DashboardHeader({ role, title, subtitle, onBack }: DashboardHeaderProps) {
  return (
    <>
      {role !== 'elderly' && (
        <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-surface-light dark:bg-surface-dark border-r border-tertiary-200 px-5 py-6">
          <div className="flex items-center gap-2 mb-10 px-2">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-text flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5" fill="currentColor" />
            </div>
            <span className="font-heading font-bold text-xl text-text-light dark:text-text-dark">CareBridge</span>
          </div>
          <nav className="space-y-2">
            {roleNav[role].map((item) => (
              <a key={item.label} href={`#${item.label.toLowerCase().replace(/[^a-z]+/g, '-')}`} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-text-muted-light hover:bg-tertiary hover:text-tertiary-text transition-colors">
                <item.icon className="w-5 h-5" />
                {item.label}
              </a>
            ))}
          </nav>
          <button onClick={onBack} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-text-muted-light hover:bg-tertiary hover:text-tertiary-text transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Switch role
          </button>
        </aside>
      )}
      <header className="lg:ml-64 bg-primary-100 dark:bg-surface-dark text-text-light dark:text-text-dark">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-primary text-primary-text hover:brightness-95 transition-colors"
              aria-label="Back to role selection"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading font-bold text-lg sm:text-xl">{title}</h1>
              {subtitle && <p className="text-text-muted-light dark:text-text-muted-dark text-xs sm:text-sm">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-secondary" fill="currentColor" />
            <span className="font-heading font-bold text-base hidden sm:block">CareBridge</span>
          </div>
        </div>
      </div>
      </header>
      {role !== 'elderly' && (
        <nav className="lg:hidden sticky top-0 z-20 flex overflow-x-auto gap-1 bg-surface-light dark:bg-surface-dark border-b border-tertiary-200 px-3 py-2">
          {roleNav[role].map((item) => (
            <a key={item.label} href={`#${item.label.toLowerCase().replace(/[^a-z]+/g, '-')}`} className="flex min-w-max items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-text-muted-light hover:bg-tertiary hover:text-tertiary-text">
              <item.icon className="w-4 h-4" />{item.label}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
