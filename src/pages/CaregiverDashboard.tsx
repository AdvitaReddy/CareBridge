import { useState } from 'react';
import {
  CheckSquare, Square, Clock, AlertTriangle, Calendar,
  MapPin, Stethoscope, Pill, Check, User,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { primaryCaregiver, elderlyPerson, formatClockTime, formatDate } from '@/data/mockData';
import DashboardHeader from '@/components/DashboardHeader';
import SOSBanner from '@/components/SOSBanner';
import Disclaimer from '@/components/Disclaimer';
import BridgeyHero from '@/components/BridgeyHero';

interface CaregiverDashboardProps {
  onBack: () => void;
}

type Tab = 'tasks' | 'schedule' | 'alerts';

export default function CaregiverDashboard({ onBack }: CaregiverDashboardProps) {
  const { caregiverTasks, toggleTask, appointments, activeSOS, sosEvents, medicines } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');

  const upcomingAppts = appointments.filter(
    (a) => new Date(a.date + 'T00:00:00') >= new Date('2026-09-12T00:00:00')
  );
  const pendingTasks = caregiverTasks.filter((t) => !t.done);
  const doneTasks = caregiverTasks.filter((t) => t.done);
  const sosHistory = sosEvents.slice(0, 5);

  const tabs: { id: Tab; label: string; icon: typeof Clock }[] = [
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'schedule', label: "Today's Schedule", icon: Calendar },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  const priorityColors: Record<string, string> = {
    high: 'bg-danger-100 text-danger-700',
    medium: 'bg-warning-100 text-warning-700',
    low: 'bg-neutral-100 text-neutral-600',
  };

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-bg-dark">
      <DashboardHeader
        role="caregiver"
        title={`${primaryCaregiver.name} · Caregiver`}
        subtitle={`Caring for ${elderlyPerson.name} in ${elderlyPerson.location}`}
        onBack={onBack}
      />

      <div className="lg:ml-64 max-w-7xl mx-auto px-6 md:px-12 pt-6">
        <BridgeyHero
          eyebrow="Your care shift"
          message={activeSOS ? 'An alert needs your attention right now.' : `You have ${pendingTasks.length} task${pendingTasks.length === 1 ? '' : 's'} today.`}
          expression={activeSOS ? 'concerned' : pendingTasks.length === 0 ? 'relieved' : 'happy'}
        />
      </div>

      <div className="lg:ml-64 max-w-7xl mx-auto px-6 md:px-12 py-6">
        {/* SOS Banner */}
        {activeSOS && (
          <div className="mb-6">
            <SOSBanner canResolve />
          </div>
        )}

        {/* Care recipient info card */}
        <div className="card p-4 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-base text-neutral-800">
              {elderlyPerson.name} (Age {elderlyPerson.age})
            </h3>
            <p className="text-sm text-neutral-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {elderlyPerson.location} · {elderlyPerson.phone}
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="font-display font-bold text-xl text-neutral-800">{pendingTasks.length}</p>
              <p className="text-xs text-neutral-400">Pending</p>
            </div>
            <div>
              <p className="font-display font-bold text-xl text-success-600">{doneTasks.length}</p>
              <p className="text-xs text-neutral-400">Done</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto border-b border-neutral-200 mb-6 -mx-6 px-6 md:mx-0 md:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'tab-active' : 'tab-inactive'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'alerts' && activeSOS && (
                <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-display font-bold text-lg text-neutral-800">Assigned Tasks</h3>
            <div className="space-y-3">
              {caregiverTasks.map((task) => (
                <div
                  key={task.id}
                  className={`card p-4 ${task.done ? 'opacity-60' : ''} transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {task.done ? (
                        <CheckSquare className="w-6 h-6 text-success-500" />
                      ) : (
                        <Square className="w-6 h-6 text-neutral-300 hover:text-primary-400 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className={`font-semibold text-sm ${task.done ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                          {task.title}
                        </h4>
                        <span className={`badge ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span className="text-xs text-neutral-500">{formatClockTime(task.time)}</span>
                        {task.done && (
                          <span className="text-xs text-success-600 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="font-display font-bold text-lg text-neutral-800 mb-3 flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary-500" />
                Medicine Schedule for {elderlyPerson.name}
              </h3>
              <div className="space-y-2">
                {medicines.map((med) => (
                  <div key={med.id} className="card p-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      med.status === 'taken' ? 'bg-success-100 text-success-600' : 'bg-primary-100 text-primary-600'
                    }`}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-neutral-800">{med.name} {med.dosage}</p>
                      <p className="text-xs text-neutral-500">{med.frequency} · {med.times.map(formatClockTime).join(', ')}</p>
                    </div>
                    <span className={`badge ${med.status === 'taken' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                      {med.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-neutral-800 mb-3 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-secondary-500" />
                Upcoming Appointments
              </h3>
              <div className="space-y-3">
                {upcomingAppts.map((appt) => (
                  <div key={appt.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-neutral-800">{appt.doctorName}</h4>
                        <p className="text-xs text-neutral-500">{appt.specialty}</p>
                        <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(appt.date)} at {formatClockTime(appt.time)}
                        </p>
                        <p className="text-xs text-neutral-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {appt.location}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-display font-bold text-lg text-neutral-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
              SOS Alerts & History
            </h3>
            {activeSOS ? (
              <SOSBanner canResolve />
            ) : (
              <div className="card p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-success-100 text-success-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <p className="font-semibold text-sm text-neutral-700">No active alerts</p>
                <p className="text-xs text-neutral-400 mt-1">All clear. No SOS events pending.</p>
              </div>
            )}
            <div>
              <h4 className="font-display font-semibold text-sm text-neutral-700 mb-3">Recent SOS Events</h4>
              <div className="space-y-2">
                {sosHistory.map((event) => (
                  <div key={event.id} className="card p-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      event.status === 'active' ? 'bg-danger-100 text-danger-600' : 'bg-success-100 text-success-600'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-800">
                        SOS by {event.triggeredBy}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(event.timestamp)} · {event.status}
                      </p>
                    </div>
                    <span className={`badge ${event.status === 'active' ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'}`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="py-6">
        <Disclaimer />
      </footer>
    </div>
  );
}
