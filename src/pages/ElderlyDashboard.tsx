import { useEffect, useState } from 'react';
import { AlertTriangle, Pill, Calendar, Check, Clock, MapPin } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { elderlyPerson, formatDateTime } from '@/data/mockData';
import DashboardHeader from '@/components/DashboardHeader';
import Disclaimer from '@/components/Disclaimer';
import BridgeyHero from '@/components/BridgeyHero';
import SharedTimeline from '@/components/SharedTimeline';
import SOSBanner from '@/components/SOSBanner';
import SOSCountdownModal from '@/components/SOSCountdownModal';

interface ElderlyDashboardProps {
  onBack: () => void;
}

export default function ElderlyDashboard({ onBack }: ElderlyDashboardProps) {
  const {
    doses, appointments, activeSOS,
    confirmDose, profile, careLoading, careError, timelineEvents,
  } = useApp();
  const [showSOSCountdown, setShowSOSCountdown] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosLocationUnavailable, setSosLocationUnavailable] = useState(false);
  const [doseError, setDoseError] = useState<string | null>(null);
  const [appointmentClock, setAppointmentClock] = useState(Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setAppointmentClock(Date.now()), 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const actionableDoses = doses.filter((dose) => ['scheduled', 'due', 'missed'].includes(dose.status));
  const nextDose = actionableDoses[0];
  const upcomingAppts = appointments
    .filter((appointment) => appointment.status === 'scheduled'
      && new Date(`${appointment.date}T${appointment.time}`).getTime() >= appointmentClock)
    .slice(0, 3);
  const medicinesRemaining = actionableDoses.length;
  const heroMessage = activeSOS
    ? 'Your family has been notified. Stay with us, help is coming.'
    : medicinesRemaining === 0
      ? 'All done for today, great job!'
      : `You have ${medicinesRemaining} medicine${medicinesRemaining === 1 ? '' : 's'} to take today.`;

  const handleSOSTriggered = (locationUnavailable: boolean) => {
    setSosTriggered(true);
    setSosLocationUnavailable(locationUnavailable);
    setTimeout(() => setSosTriggered(false), 5000);
  };

  const openSOSConfirmation = () => {
    setShowSOSCountdown(true);
  };

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-bg-dark text-lg font-body">
      <DashboardHeader
        title={`Hello, ${profile?.full_name ?? elderlyPerson.name}`}
        subtitle={`${elderlyPerson.location} · Age ${elderlyPerson.age}`}
        onBack={onBack}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6">
        <BridgeyHero
          eyebrow={activeSOS ? 'Bridgey is staying close' : 'Your care companion'}
          message={heroMessage}
          expression={activeSOS ? 'concerned' : medicinesRemaining === 0 ? 'relieved' : 'happy'}
        />
      </div>

      {/* SOS triggered confirmation */}
      {sosTriggered && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-success-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-slide-up">
          <Check className="w-5 h-5" />
          <span className="font-semibold text-lg">SOS sent.{sosLocationUnavailable ? ' Location unavailable.' : ' Help is on the way.'}</span>
        </div>
      )}

      {/* Active SOS banner */}
      {activeSOS && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-4">
          <SOSBanner />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 space-y-8">
        {/* SOS Button */}
        <div className="text-center">
          <button
            onClick={openSOSConfirmation}
            disabled={!!activeSOS}
            className={`w-48 h-48 mx-auto rounded-full bg-danger text-danger-text font-body font-bold text-3xl shadow-2xl flex flex-col items-center justify-center gap-2 ${
              activeSOS ? 'opacity-50 cursor-not-allowed' : `${sosTriggered ? 'animate-sos-ripple' : ''} hover:scale-105 transition-transform active:scale-95`
            }`}
          >
            <AlertTriangle className="w-14 h-14" fill="currentColor" />
            SOS
          </button>
          <p className="text-lg text-neutral-500 mt-4">
            Press the button in an emergency
          </p>
        </div>

        {/* My Day medicines */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <Pill className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-2xl text-neutral-800">My Day</h2>
          </div>
          {careError && <p role="alert" className="mb-3 text-sm text-danger-600">{careError}</p>}
          {doseError && <p role="alert" className="mb-3 text-sm text-danger-600">{doseError}</p>}
          {nextDose ? (
            <div className="card border-2 border-primary-200 p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase text-primary-600">Next dose</p>
              <h3 className="font-display font-bold text-2xl sm:text-3xl text-neutral-800 mt-2">
                {nextDose.medicine_name}
              </h3>
              <p className="text-lg text-neutral-600 mt-1">{nextDose.medicine_dosage}</p>
              <p className="text-base text-neutral-500 mt-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {formatDateTime(nextDose.scheduled_at)}
              </p>
              <button
                type="button"
                onClick={async () => {
                  setDoseError(null);
                  try {
                    await confirmDose(nextDose.id);
                  } catch (error) {
                    setDoseError(error instanceof Error ? error.message : 'Unable to confirm this dose.');
                  }
                }}
                className="mt-6 w-full btn-elderly bg-success text-success-text hover:brightness-95"
              >
                <Check className="w-6 h-6" />
                Mark as Taken
              </button>
            </div>
          ) : careLoading ? (
            <div className="card p-6 text-center text-neutral-500">Loading today's doses…</div>
          ) : (
            <div className="card p-6 text-center text-neutral-500">No doses are scheduled for today.</div>
          )}
          <div className="mt-5 space-y-2">
            <h3 className="font-display font-semibold text-base text-neutral-700">Today's schedule</h3>
            {doses.map((dose) => (
              <div key={dose.id} className="card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  dose.status === 'taken' || dose.status === 'taken_late'
                    ? 'bg-success-100 text-success-600'
                    : dose.status === 'missed'
                      ? 'bg-danger-100 text-danger-600'
                      : 'bg-primary-100 text-primary-600'
                }`}>
                  {dose.status === 'taken' || dose.status === 'taken_late' ? <Check className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base text-neutral-800">{dose.medicine_name} · {dose.medicine_dosage}</p>
                  <p className="text-sm text-neutral-500">{formatDateTime(dose.scheduled_at)}</p>
                </div>
                <span className={`badge ${
                  dose.status === 'taken' || dose.status === 'taken_late'
                    ? 'bg-success-100 text-success-700'
                    : dose.status === 'missed'
                      ? 'bg-danger-100 text-danger-700'
                      : dose.status === 'due'
                        ? 'bg-warning-100 text-warning-700'
                        : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {dose.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Today's Appointments */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary-100 text-secondary-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-2xl text-neutral-800">Upcoming Appointments</h2>
          </div>
          {upcomingAppts.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppts.map((appt) => {
                const scheduledAt = new Date(`${appt.date}T${appt.time}`);
                const totalMinutes = Math.max(0, Math.floor((scheduledAt.getTime() - appointmentClock) / 60_000));
                const countdown = totalMinutes >= 24 * 60
                  ? `${Math.floor(totalMinutes / (24 * 60))}d ${Math.floor((totalMinutes % (24 * 60)) / 60)}h`
                  : totalMinutes >= 60
                    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                    : `${totalMinutes}m`;
                return (
                  <div key={appt.id} className="card p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary-100 text-secondary-600 flex items-center justify-center">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-xl text-neutral-800">
                          {appt.doctorName}
                        </h3>
                        <p className="text-lg text-neutral-500">{appt.specialty}</p>
                        <div className="mt-2 space-y-1.5">
                          <p className="text-base text-neutral-600 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-neutral-400" />
                            {formatDateTime(scheduledAt.toISOString())}
                          </p>
                          <p className="text-base text-neutral-600 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-neutral-400" />
                            {appt.location}
                          </p>
                        </div>
                        <span
                          className="inline-flex mt-3 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary-100 text-primary-700"
                        >
                          Upcoming
                        </span>
                        <p className="inline-flex mt-3 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary-100 text-primary-700">
                          <Clock className="w-4 h-4 mr-1" /> In {countdown}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {appt.reminder24hSent && <span className="badge bg-secondary-100 text-secondary-700">24h reminder sent</span>}
                          {appt.reminder1hSent && <span className="badge bg-accent-100 text-accent-700">1h reminder sent</span>}
                          {!appt.reminder24hSent && !appt.reminder1hSent && <span className="badge bg-neutral-100 text-neutral-600">Reminders pending</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-lg text-neutral-400">No upcoming appointments.</p>
            </div>
          )}
        </section>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-6">
        <SharedTimeline events={timelineEvents} />
      </div>

      {showSOSCountdown && (
        <SOSCountdownModal
          onClose={() => setShowSOSCountdown(false)}
          onTriggered={handleSOSTriggered}
        />
      )}

      <footer className="py-6">
        <Disclaimer />
      </footer>
    </div>
  );
}
