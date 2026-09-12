import { Pill, Calendar, AlertTriangle, FileText, Heart, CheckCircle2, AlertCircle } from 'lucide-react';
import type { TimelineEntry as TimelineEntryType } from '@/data/mockData';
import { formatDateTime } from '@/data/mockData';

const config = {
  medicine: {
    icon: Pill,
    bg: 'bg-primary-100',
    text: 'text-primary-600',
    line: 'bg-primary-200',
  },
  appointment: {
    icon: Calendar,
    bg: 'bg-secondary-100',
    text: 'text-secondary-600',
    line: 'bg-secondary-200',
  },
  sos: {
    icon: AlertTriangle,
    bg: 'bg-danger-100',
    text: 'text-danger-600',
    line: 'bg-danger-200',
  },
  note: {
    icon: FileText,
    bg: 'bg-accent-100',
    text: 'text-accent-700',
    line: 'bg-accent-200',
  },
  caregiver: {
    icon: Heart,
    bg: 'bg-secondary-100',
    text: 'text-secondary-600',
    line: 'bg-secondary-200',
  },
};

export default function TimelineEntry({ entry }: { entry: TimelineEntryType }) {
  const c = config[entry.type] ?? config.note;
  const Icon = c.icon;

  return (
    <div className="flex gap-3 sm:gap-4 group">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`w-0.5 flex-1 ${c.line} mt-1 min-h-[2rem]`} />
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-display font-semibold text-sm sm:text-base text-neutral-800">
            {entry.title}
          </h4>
          {entry.status === 'taken' && <CheckCircle2 className="w-4 h-4 text-success-500" />}
          {entry.status === 'missed' && <AlertCircle className="w-4 h-4 text-danger-500" />}
          {entry.status === 'active' && (
            <span className="badge bg-danger-100 text-danger-700">
              <span className="w-1.5 h-1.5 rounded-full bg-danger-500 animate-pulse" />
              Active
            </span>
          )}
          {entry.status === 'resolved' && (
            <span className="badge bg-success-100 text-success-700">Resolved</span>
          )}
        </div>
        <p className="text-sm text-neutral-500 mt-1">{entry.description}</p>
        <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1">
          {formatDateTime(entry.timestamp)}
        </p>
      </div>
    </div>
  );
}
