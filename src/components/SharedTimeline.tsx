import { Activity, AlertCircle, CheckCircle2, ClipboardList, FileText, Pill, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp, type CareTimelineEvent, type CareVisitNote } from '@/context/AppContext';
import { formatDateTime } from '@/data/mockData';

const eventPresentation: Record<string, { label: string; icon: typeof Pill; color: string }> = {
  dose_missed: { label: 'Dose missed', icon: AlertCircle, color: 'text-danger-600 bg-danger-100' },
  dose_taken: { label: 'Dose taken', icon: CheckCircle2, color: 'text-success-600 bg-success-100' },
  dose_taken_late: { label: 'Dose taken late', icon: Pill, color: 'text-warning-700 bg-warning-100' },
  sos_triggered: { label: 'SOS triggered', icon: AlertCircle, color: 'text-danger-600 bg-danger-100' },
  sos_acknowledged: { label: 'SOS acknowledged', icon: CheckCircle2, color: 'text-warning-700 bg-warning-100' },
  sos_escalated: { label: 'SOS escalated', icon: AlertCircle, color: 'text-danger-600 bg-danger-100' },
  sos_resolved: { label: 'SOS resolved', icon: CheckCircle2, color: 'text-success-600 bg-success-100' },
  sos_cancelled: { label: 'SOS cancelled', icon: AlertCircle, color: 'text-neutral-600 bg-neutral-100' },
  note: { label: 'Care note', icon: FileText, color: 'text-accent-700 bg-accent-100' },
  task: { label: 'Caregiver task', icon: ClipboardList, color: 'text-primary-600 bg-primary-100' },
  visit: { label: 'Visit note', icon: FileText, color: 'text-accent-700 bg-accent-100' },
};

export default function SharedTimeline({ events }: { events: CareTimelineEvent[] }) {
  const { tasks, visitNotes, careCircle } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<CareTimelineEvent | null>(null);
  const selectedTask = selectedEvent?.type === 'task'
    ? tasks.find((task) => task.id === selectedEvent.linked_id)
    : tasks.find((task) => task.id === visitNotes.find((note) => note.id === selectedEvent?.linked_id)?.task_id);
  const selectedNote = selectedEvent?.type === 'visit'
    ? visitNotes.find((note) => note.id === selectedEvent.linked_id)
    : null;
  const selectedTaskNotes = selectedTask
    ? visitNotes.filter((note) => note.task_id === selectedTask.id)
    : [];
  const linkedEventIds = new Set<string>();

  useEffect(() => {
    const openCareEvent = (event: Event) => {
      const { linkedId } = (event as CustomEvent<{ linkedId?: string }>).detail ?? {};
      if (!linkedId) return;
      const matchingEvent = events.find((item) =>
        item.linked_id === linkedId && (item.type === 'task' || item.type === 'visit')
      );
      if (!matchingEvent) {
        document.getElementById(`care-event-${linkedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      setSelectedEvent(matchingEvent);
      window.setTimeout(() => {
        document.getElementById('care-event-details')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    };
    window.addEventListener('carebridge:open-care-event', openCareEvent);
    return () => window.removeEventListener('carebridge:open-care-event', openCareEvent);
  }, [events]);

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
            const isTaskEvent = event.type === 'task' || event.type === 'visit';
            const timelineAnchorId = event.linked_id && !linkedEventIds.has(event.linked_id)
              ? `care-event-${event.linked_id}`
              : undefined;
            if (event.linked_id) linkedEventIds.add(event.linked_id);
            const eventContent = (
              <>
                <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${presentation.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-xs font-semibold uppercase text-neutral-400">{presentation.label}</span>
                  <span className="block text-sm text-neutral-800 mt-0.5">{event.message}</span>
                  <span className="block text-xs text-neutral-400 mt-1">{formatDateTime(event.created_at)}</span>
                </span>
              </>
            );
            return (
              <article
                key={event.id}
                id={timelineAnchorId}
                className="py-3 first:pt-0 last:pb-0 scroll-mt-24"
              >
                {isTaskEvent ? (
                  <button
                    type="button"
                    onClick={() => setSelectedEvent((current) => current?.id === event.id ? null : event)}
                    aria-expanded={selectedEvent?.id === event.id}
                    className="w-full flex items-start gap-3 text-left rounded-xl hover:bg-primary-50 p-1 -m-1 transition-colors"
                  >
                    {eventContent}
                  </button>
                ) : (
                  <div className="flex items-start gap-3">{eventContent}</div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {selectedEvent && (
        <aside id="care-event-details" className="mt-4 rounded-2xl border border-primary-100 bg-primary-50/70 p-4" aria-label="Task and visit details">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-neutral-400">
                {selectedEvent.type === 'visit' ? 'Visit details' : 'Task details'}
              </p>
              <h3 className="font-display font-bold text-base text-neutral-800 mt-1">
                {selectedTask?.title ?? selectedEvent.message}
              </h3>
            </div>
            <button type="button" onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg text-neutral-500 hover:bg-white" aria-label="Close details">
              <X className="w-4 h-4" />
            </button>
          </div>
          {selectedTask ? (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-600">
              <span>Status: <strong className="capitalize">{selectedTask.status.replace('_', ' ')}</strong></span>
              <span>Created: {formatDateTime(selectedTask.created_at)}</span>
              {selectedTask.due_at && <span>Due: {formatDateTime(selectedTask.due_at)}</span>}
              {selectedTask.completed_at && <span>Completed: {formatDateTime(selectedTask.completed_at)}</span>}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 mt-2">Task details are no longer available.</p>
          )}
          {selectedNote ? (
            <div className="mt-3 rounded-xl bg-white p-3">
              <p className="text-xs text-neutral-400 mb-1">
                Visit note · {careCircle.find((member) => member.id === selectedNote.author)?.name ?? 'Caregiver'} · {formatDateTime(selectedNote.created_at)}
              </p>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selectedNote.note}</p>
            </div>
          ) : selectedTaskNotes.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedTaskNotes.map((visitNote: CareVisitNote) => (
                <div key={visitNote.id} className="rounded-xl bg-white p-3">
                  <p className="text-xs text-neutral-400 mb-1">Visit note · {formatDateTime(visitNote.created_at)}</p>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{visitNote.note}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      )}
    </section>
  );
}