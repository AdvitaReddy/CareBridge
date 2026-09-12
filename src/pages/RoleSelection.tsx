import { Heart, User, Users, Stethoscope, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Role } from '@/data/mockData';
import Disclaimer from '@/components/Disclaimer';

interface RoleSelectionProps {
  onSelect: (role: Role) => void;
  onBack: () => void;
}

const roles: {
  id: Role;
  title: string;
  desc: string;
  icon: typeof User;
  gradient: string;
  iconBg: string;
  features: string[];
}[] = [
  {
    id: 'elderly',
    title: 'Elderly Person',
    desc: 'The care recipient',
    icon: User,
    gradient: 'from-primary-500 to-primary-600',
    iconBg: 'bg-primary-100 text-primary-600',
    features: ['Large, simple interface', 'Today\'s medicines', 'One-tap SOS button'],
  },
  {
    id: 'family',
    title: 'Family Member',
    desc: 'A distant relative',
    icon: Users,
    gradient: 'from-secondary-500 to-secondary-600',
    iconBg: 'bg-secondary-100 text-secondary-600',
    features: ['Full dashboard with tabs', 'Timeline & SOS history', 'Manage medicines & appointments'],
  },
  {
    id: 'caregiver',
    title: 'Caregiver / Nurse',
    desc: 'Local caregiver',
    icon: Stethoscope,
    gradient: 'from-secondary-600 to-primary-500',
    iconBg: 'bg-secondary-100 text-secondary-600',
    features: ['Assigned tasks & schedule', 'Incoming SOS alerts', 'Mark tasks as done'],
  },
  {
    id: 'admin',
    title: 'Admin',
    desc: 'Platform administrator',
    icon: Shield,
    gradient: 'from-neutral-700 to-neutral-600',
    iconBg: 'bg-neutral-100 text-neutral-600',
    features: ['User management', 'Caregiver verification', 'Platform statistics'],
  },
];

export default function RoleSelection({ onSelect, onBack }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-secondary-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl text-neutral-800">CareBridge</span>
        </div>
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-100 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-10">
          <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-neutral-800">
            Who are you?
          </h1>
          <p className="text-neutral-500 mt-3 max-w-lg mx-auto">
            Choose a role to explore the matching dashboard. You can switch roles anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {roles.map((r, idx) => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="card p-6 text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group animate-slide-up"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${r.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <r.icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg text-neutral-800">{r.title}</h3>
                  <p className="text-sm text-neutral-500">{r.desc}</p>
                  <ul className="mt-3 space-y-1.5">
                    {r.features.map((f) => (
                      <li key={f} className="text-xs text-neutral-500 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${r.gradient}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <footer className="py-8">
        <Disclaimer />
      </footer>
    </div>
  );
}
