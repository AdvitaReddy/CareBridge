import { useState } from 'react';
import {
  ClipboardList, Clock, AlertTriangle, Calendar,
  MapPin, Stethoscope, Pill, Check, User,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { primaryCaregiver, elderlyPerson, formatClockTime, formatDate } from '@/data/mockData';
import DashboardHeader from '@/components/DashboardHeader';
import SOSBanner from '@/components/SOSBanner';
import Disclaimer from '@/components/Disclaimer';
import BridgeyHero from '@/components/BridgeyHero';
import SharedTimeline from '@/components/SharedTimeline';
import AssignedCareTasks from '@/components/AssignedCareTasks';

interface CaregiverDashboardProps {
  onBack: () => void;
}

type Tab = 'today' | 'tasks' | 'schedule' | 'alerts';

export default function CaregiverDashboard({ onBack }: CaregiverDashboardProps) {
  const { profile, tasks, appointments, activeSOS, sosEvents, medicines, timelineEvents } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('today');

  const upcomingAppts = appointments.filter(
    (a) => new Date(a.date + 'T00:00:00') >= new Date('2026-09-12T00:00:00')
  );
  const assignedTasks = tasks.filter((task) => task.assigned_to === profile?.id);
  const pendingTasks = assignedTasks.filter((task) => task.status !== 'completed');
  const doneTasks = assignedTasks.filter((task) => task.status === 'completed');
  const sosHistory = sosEvents.slice(0, 5);

  const tabs: { id: Tab; label: string; icon: typeof Clock }[] = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'schedule', label: "Today's Schedule", icon: Calendar },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-bg-dark">
      <DashboardHeader
        title={`${primaryCaregiver.name} · Caregiver`}
        subtitle={`Caring for ${elderlyPerson.name} in ${elderlyPerson.location}`}
        onBack={onBack}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6">
        <BridgeyHero
          eyebrow="Your care shift"
          message={activeSOS ? 'An alert needs your attention right now.' : `You have ${pendingTasks.length} assigned task${pendingTasks.length === 1 ? '' : 's'} to review.`}
          expression={activeSOS ? 'concerned' : pendingTasks.length === 0 ? 'relieved' : 'happy'}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
        {/* SOS Banner */}
        {activeSOS && (
          <div className="mb-6">
            <SOSBanner />
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

        {activeTab === 'today' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-display font-bold text-lg text-neutral-800">Today’s Tasks</h3>
            <AssignedCareTasks todayOnly />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-display font-bold text-lg text-neutral-800">Assigned Tasks</h3>
            <AssignedCareTasks />
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
              <SOSBanner />
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
                      ['active', 'acknowledged', 'escalated'].includes(event.status) ? 'bg-danger-100 text-danger-600' : 'bg-success-100 text-success-600'
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
                      {event.responderName && (
                        <p className="text-xs font-semibold text-success-700 mt-1">
                          {event.responderName} responded · Help is on the way
                        </p>
                      )}
                    </div>
                    <span className={`badge ${['active', 'acknowledged', 'escalated'].includes(event.status) ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'}`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-6">
        <SharedTimeline events={timelineEvents} />
      </div>

      <footer className="py-6">
        <Disclaimer />
      </footer>
    </div>
  );
}
