import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import useFormFeedback from '@/hooks/useFormFeedback';
import FormFeedbackMessage from '@/components/FormFeedbackMessage';
import type { Appointment } from '@/data/mockData';

interface AddAppointmentModalProps {
  onClose: () => void;
  appointment?: Appointment;
}

export default function AddAppointmentModal({ onClose, appointment }: AddAppointmentModalProps) {
  const { addAppointment, updateAppointment } = useApp();
  const [doctorName, setDoctorName] = useState(appointment?.doctorName ?? '');
  const [specialty, setSpecialty] = useState(appointment?.specialty ?? '');
  const [date, setDate] = useState(appointment?.date ?? '');
  const [time, setTime] = useState(appointment?.time ?? '');
  const [location, setLocation] = useState(appointment?.location ?? '');
  const [notes, setNotes] = useState(appointment?.notes ?? '');
  const { isSaving, success, error, clear, run } = useFormFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !date || !time) return;
    const input = {
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || 'General',
      date,
      time,
      location: location.trim(),
      notes: notes.trim(),
    };
    const saved = await run(
      () => appointment
        ? updateAppointment(appointment.id, input)
        : addAppointment(input),
      appointment ? 'Updated' : 'Added'
    );
    if (!saved) return;
    setDoctorName('');
    setSpecialty('');
    setDate('');
    setTime('');
    setLocation('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-dark/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-neutral-800">{appointment ? 'Edit Appointment' : 'Add Appointment'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Doctor Name</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => { clear(); setDoctorName(e.target.value); }}
              placeholder="e.g. Dr. Suresh Reddy"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Specialty</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => { clear(); setSpecialty(e.target.value); }}
              placeholder="e.g. Cardiology"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => { clear(); setDate(e.target.value); }}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => { clear(); setTime(e.target.value); }}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => { clear(); setLocation(e.target.value); }}
              placeholder="e.g. Care Hospital, Vijayawada"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => { clear(); setNotes(e.target.value); }}
              placeholder="Any special instructions..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 btn-primary px-4 py-2.5 disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : appointment ? 'Save Changes' : 'Add Appointment'}
            </button>
            <FormFeedbackMessage success={success} error={error} />
          </div>
        </form>
      </div>
    </div>
  );
}
