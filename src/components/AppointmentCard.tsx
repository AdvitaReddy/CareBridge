import { Calendar, MapPin, Stethoscope, FileText } from 'lucide-react';
import type { Appointment } from '@/data/mockData';
import { appointmentBadge, formatClockTime, formatDate } from '@/data/mockData';

interface AppointmentCardProps {
  appointment: Appointment;
  onAddSummary?: (id: string) => void;
}

export default function AppointmentCard({ appointment, onAddSummary }: AppointmentCardProps) {
  const badge = appointmentBadge(appointment.date);

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
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
                  ? 'bg-danger text-danger-text'
                  : badge.color === 'accent'
                    ? 'bg-tertiary text-tertiary-text'
                    : 'bg-primary text-primary-text'
              }`}
            >
              {badge.label}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">{appointment.specialty}</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4 text-neutral-400" />
              {formatDate(appointment.date)} at {formatClockTime(appointment.time)}
            </div>
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
          {onAddSummary && !appointment.summary && (
            <button
              onClick={() => onAddSummary(appointment.id)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Add post-visit summary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
