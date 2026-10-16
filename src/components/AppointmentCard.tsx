import { useEffect, useState } from 'react';
import { Calendar, MapPin, Stethoscope, FileText, Pencil, XCircle, Clock } from 'lucide-react';
import type { Appointment } from '@/data/mockData';
import { formatDateTime } from '@/data/mockData';

interface AppointmentCardProps {
  appointment: Appointment;
  onAddSummary?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
  showCountdown?: boolean;
}

function appointmentDate(appointment: Appointment) {
  return new Date(`${appointment.date}T${appointment.time}`);
}

function countdownLabel(milliseconds: number) {
  if (milliseconds <= 0) return 'Appointment time has passed';
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days) return `In ${days}d ${hours}h`;
  if (hours) return `In ${hours}h ${minutes}m`;
  return `In ${minutes}m`;
}

export default function AppointmentCard({ appointment, onAddSummary, onEdit, onCancel, showCountdown = false }: AppointmentCardProps) {
  const scheduledAt = appointmentDate(appointment);
  const [now, setNow] = useState(Date.now());
  const status = appointment.status ?? 'scheduled';
  const canAddSummary = status === 'completed' || scheduledAt.getTime() <= now;
  const badge = status === 'cancelled'
    ? { label: 'Cancelled', color: 'danger' }
    : status === 'completed'
      ? { label: 'Completed', color: 'accent' }
      : scheduledAt.getTime() < now
        ? { label: 'Past', color: 'neutral' }
        : scheduledAt.toDateString() === new Date(now).toDateString()
          ? { label: 'Today', color: 'danger' }
          : scheduledAt.getTime() - now < 48 * 60 * 60 * 1000
            ? { label: 'Upcoming', color: 'accent' }
            : { label: 'Scheduled', color: 'primary' };

  useEffect(() => {
    if (!showCountdown) return;
    const intervalId = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(intervalId);
  }, [showCountdown]);

  return (
    <div className={`card p-4 hover:shadow-md transition-shadow ${status === 'cancelled' ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-display font-bold text-base text-neutral-800">
              {appointment.doctorName}
            </h3>
            <span
              className={`badge ${
                badge.color === 'danger'
                  ? 'bg-danger-100 text-danger-700'
                  : badge.color === 'accent'
                    ? 'bg-accent-100 text-accent-700'
                    : 'bg-primary-100 text-primary-700'
              }`}
            >
              {badge.label}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">{appointment.specialty}</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4 text-neutral-400" />
              {formatDateTime(scheduledAt.toISOString())}
            </div>
            {showCountdown && status === 'scheduled' && scheduledAt.getTime() > now && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700">
                <Clock className="w-4 h-4" /> {countdownLabel(scheduledAt.getTime() - now)}
              </p>
            )}
            {(appointment.reminder24hSent || appointment.reminder1hSent) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {appointment.reminder24hSent && <span className="badge bg-secondary-100 text-secondary-700">24h reminder sent</span>}
                {appointment.reminder1hSent && <span className="badge bg-accent-100 text-accent-700">1h reminder sent</span>}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <MapPin className="w-4 h-4 text-neutral-400" />
              {appointment.location}
            </div>
            {appointment.notes && (
              <div className="flex items-start gap-2 text-sm text-neutral-500">
                <FileText className="w-4 h-4 text-neutral-400 mt-0.5" />
                {appointment.notes}
              </div>
            )}
          </div>
          {appointment.summary && (
            <div className="mt-3 p-3 bg-secondary-50 rounded-xl border border-secondary-100">
              <p className="text-xs font-semibold text-secondary-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Post-Visit Notes
              </p>
              <p className="text-sm text-neutral-600">{appointment.summary}</p>
            </div>
          )}
          {onAddSummary && !appointment.summary && canAddSummary && (
            <button
              onClick={() => onAddSummary(appointment.id)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Add post-visit summary
            </button>
          )}
          {(onEdit || onCancel) && status === 'scheduled' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {onEdit && (
                <button type="button" onClick={() => onEdit(appointment.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {onCancel && (
                <button type="button" onClick={() => onCancel(appointment.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-danger-200 px-3 py-2 text-xs font-semibold text-danger-600 hover:bg-danger-50">
                  <XCircle className="w-3.5 h-3.5" /> Cancel appointment
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
