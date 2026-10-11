import { Activity, AlertCircle, CheckCircle2, FileText, Pill } from 'lucide-react';
import type { CareTimelineEvent } from '@/context/AppContext';
import { formatDateTime } from '@/data/mockData';

const eventPresentation: Record<string, { label: string; icon: typeof Pill; color: string }> = {
  dose_missed: { label: 'Dose missed', icon: AlertCircle, color: 'text-danger-600 bg-danger-100' },
  dose_taken: { label: 'Dose taken', icon: CheckCircle2, color: 'text-success-600 bg-success-100' },
  dose_taken_late: { label: 'Dose taken late', icon: Pill, color: 'text-warning-700 bg-warning-100' },
  note: { label: 'Care note', icon: FileText, color: 'text-accent-700 bg-accent-100' },
};

export default function SharedTimeline({ events }: { events: CareTimelineEvent[] }) {
  return (
    <section id="shared-care-timeline" className="card p-5 scroll-mt-24">
      <h2 className="font-display font-bold text-base text-neutral-800 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary-500" />
        Shared Health Timeline
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-neutral-400">No care events recorded today.</p>
      ) : (
        <div className="divide-y divide-neutral-100">
          {events.map((event) => {
            const presentation = eventPresentation[event.type] ?? {
              label: event.type.replace(/_/g, ' '),
              icon: Activity,
              color: 'text-primary-600 bg-primary-100',
            };
            const Icon = presentation.icon;
            return (
              <article
                key={event.id}
                id={event.linked_id ? `care-event-${event.linked_id}` : undefined}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 scroll-mt-24"
              >
                <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${presentation.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase text-neutral-400">{presentation.label}</p>
                  <p className="text-sm text-neutral-800 mt-0.5">{event.message}</p>
                  <p className="text-xs text-neutral-400 mt-1">{formatDateTime(event.created_at)}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}