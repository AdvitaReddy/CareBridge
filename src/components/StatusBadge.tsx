import { CheckCircle2, Clock, AlertCircle, XCircle, Bell } from 'lucide-react';

type BadgeColor = 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'accent';

interface StatusBadgeProps {
  status: string;
  label?: string;
  color?: BadgeColor;
}

const colorMap: Record<BadgeColor, string> = {
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  neutral: 'bg-neutral-100 text-neutral-600',
  primary: 'bg-primary-100 text-primary-700',
  accent: 'bg-accent-100 text-accent-700',
};

const iconMap: Record<string, typeof CheckCircle2> = {
  taken: CheckCircle2,
  done: CheckCircle2,
  resolved: CheckCircle2,
  pending: Clock,
  upcoming: Clock,
  missed: AlertCircle,
  active: Bell,
  cancelled: XCircle,
};

export default function StatusBadge({ status, label, color }: StatusBadgeProps) {
  const Icon = iconMap[status] ?? Clock;
  const resolvedColor: BadgeColor = color ?? (status === 'taken' || status === 'resolved' || status === 'done'
    ? 'success'
    : status === 'missed' || status === 'active' || status === 'cancelled'
      ? 'danger'
      : status === 'pending' || status === 'upcoming'
        ? 'warning'
        : 'neutral');
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`badge ${colorMap[resolvedColor]}`}>
      <Icon className="w-3.5 h-3.5" />
      {displayLabel}
    </span>
  );
}
