import { useState } from 'react';
import {
  Clock, Calendar, Pill, AlertTriangle, Users, Heart, Plus, Search,
  Star, MapPin, CheckCircle2, UserPlus, Activity, FileText,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { familyMember, elderlyPerson, formatDateTime } from '@/data/mockData';
import DashboardHeader from '@/components/DashboardHeader';
import SOSBanner from '@/components/SOSBanner';
import MedicineCard from '@/components/MedicineCard';
import AppointmentCard from '@/components/AppointmentCard';
import TimelineEntry from '@/components/TimelineEntry';
import Disclaimer from '@/components/Disclaimer';
import AddMedicineModal from '@/components/AddMedicineModal';
import AddAppointmentModal from '@/components/AddAppointmentModal';
import SummaryModal from '@/components/SummaryModal';
import InviteModal from '@/components/InviteModal';

type Tab = 'timeline' | 'medicines' | 'appointments' | 'caregivers' | 'sos';

interface FamilyDashboardProps {
  onBack: () => void;
}

export default function FamilyDashboard({ onBack }: FamilyDashboardProps) {
  const {
    timeline, medicines, appointments, sosEvents, caregivers, careCircle,
    markMedicineTaken, simulateMissedDose, requestCaregiver,
    activeSOS, addTimelineEntry,
  } = useApp();
  const familyMemberName = familyMember.name;
  const elderlyName = elderlyPerson.name;
  const elderlyLocation = elderlyPerson.location;

    const [activeTab, setActiveTab] = useState<Tab>('timeline');
  const [showAddMed, setShowAddMed] = useState(false);
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [showSummary, setShowSummary] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [caregiverSearch, setCaregiverSearch] = useState('');
  const [healthNote, setHealthNote] = useState('');

  const missedMeds = medicines.filter((m) => m.status === 'missed');
  const upcomingAppts = appointments.filter(
    (a) => new Date(a.date + 'T00:00:00') >= new Date('2026-09-12T00:00:00')
  );
  const filteredCaregivers = caregivers.filter((c) =>
    c.name.toLowerCase().includes(caregiverSearch.toLowerCase()) ||
    c.specialty.toLowerCase().includes(caregiverSearch.toLowerCase()) ||
    c.location.toLowerCase().includes(caregiverSearch.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: typeof Clock }[] = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'medicines', label: 'Medicines', icon: Pill },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'caregivers', label: 'Caregivers', icon: Users },
    { id: 'sos', label: 'SOS History', icon: AlertTriangle },
  ];

  const handleAddNote = () => {
    if (!healthNote.trim()) return;
    addTimelineEntry({
      type: 'note',
      title: 'Health note added',
      description: healthNote.trim(),
      timestamp: new Date().toISOString(),
    });
    setHealthNote('');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader
        role="family"
        title={`${familyMemberName} · Family Dashboard`}
        subtitle={`Monitoring ${elderlyName} in ${elderlyLocation}`}
        onBack={onBack}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* SOS Banner */}
        {activeSOS && (
          <div className="mb-6">
            <SOSBanner canResolve />
          </div>
        )}

        {/* Missed Medicine Alert */}
        {missedMeds.length > 0 && (
          <div className="mb-6 bg-warning-100 border border-warning-300 rounded-2xl p-4 flex items-start gap-3 animate-slide-in-right">
            <AlertTriangle className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold text-warning-800">
                {missedMeds.length} missed dose{missedMeds.length > 1 ? 's' : ''} today
              </p>
              <p className="text-sm text-warning-700 mt-0.5">
                {missedMeds.map((m) => m.name).join(', ')} — please follow up with {elderlyName}.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto border-b border-neutral-200 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
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
            </button>
          ))}
        </div>

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Medicines', value: medicines.length, icon: Pill, color: 'primary' },
                { label: 'Appointments', value: upcomingAppts.length, icon: Calendar, color: 'secondary' },
                { label: 'SOS Events', value: sosEvents.length, icon: AlertTriangle, color: 'danger' },
                { label: 'Care Circle', value: careCircle.length, icon: Heart, color: 'accent' },
              ].map((stat) => (
                <div key={stat.label} className="card p-4">
                  <div className={`w-9 h-9 rounded-lg bg-${stat.color}-100 text-${stat.color}-600 flex items-center justify-center mb-2`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="font-display font-bold text-2xl text-neutral-800">{stat.value}</p>
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Add health note */}
            <div className="card p-4">
              <h3 className="font-display font-semibold text-sm text-neutral-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent-600" />
                Add Health Note
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={healthNote}
                  onChange={(e) => setHealthNote(e.target.value)}
                  placeholder="e.g. BP reading 130/85, feeling better today..."
                  className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2.5 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-neutral-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                Shared Health Timeline
              </h3>
              <div>
                {timeline.map((entry) => (
                  <TimelineEntry key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === 'medicines' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-neutral-800">Medicine Schedule</h3>
              <button
                onClick={() => setShowAddMed(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </div>
            <div className="space-y-3">
              {medicines.map((med) => (
                <MedicineCard
                  key={med.id}
                  medicine={med}
                  onMarkTaken={markMedicineTaken}
                  onSimulateMissed={simulateMissedDose}
                  showSimulate
                />
              ))}
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-neutral-800">Upcoming Appointments</h3>
              <button
                onClick={() => setShowAddAppt(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Appointment
              </button>
            </div>
            <div className="space-y-3">
              {upcomingAppts.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onAddSummary={(id) => setShowSummary(id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Caregivers Tab */}
        {activeTab === 'caregivers' && (
          <div className="space-y-6 animate-fade-in">
            {/* Care Circle */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-lg text-neutral-800 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-accent-500" fill="currentColor" />
                  Care Circle
                </h3>
                <button
                  onClick={() => setShowInvite(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Family
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {careCircle.map((member) => (
                  <div key={member.id} className="card p-4 flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white ${
                      member.type === 'family' ? 'bg-primary-500' : 'bg-secondary-500'
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-neutral-800">{member.name}</p>
                      <p className="text-xs text-neutral-500">{member.role} · {member.location}</p>
                    </div>
                    <span className={`badge ${member.type === 'family' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700'}`}>
                      {member.type === 'family' ? 'Family' : 'Caregiver'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Caregiver Directory */}
            <div>
              <h3 className="font-display font-bold text-lg text-neutral-800 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-neutral-400" />
                Caregiver Directory
              </h3>
              <input
                type="text"
                value={caregiverSearch}
                onChange={(e) => setCaregiverSearch(e.target.value)}
                placeholder="Search by name, specialty, or location..."
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all mb-4"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCaregivers.map((cg) => (
                  <div key={cg.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center font-bold">
                        {cg.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-neutral-800">{cg.name}</h4>
                          {cg.verified && (
                            <CheckCircle2 className="w-4 h-4 text-success-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">{cg.specialty}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-accent-500" fill="currentColor" />
                            {cg.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {cg.location}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`badge ${cg.availability ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>
                            {cg.availability ? 'Available' : 'Unavailable'}
                          </span>
                          {cg.inCareCircle ? (
                            <span className="text-xs font-medium text-success-600 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              In Care Circle
                            </span>
                          ) : (
                            <button
                              onClick={() => requestCaregiver(cg.id)}
                              disabled={!cg.availability}
                              className="px-3 py-1.5 rounded-lg bg-secondary-500 text-white text-xs font-semibold hover:bg-secondary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Request
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SOS History Tab */}
        {activeTab === 'sos' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-display font-bold text-lg text-neutral-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
              SOS History
            </h3>
            {sosEvents.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-neutral-400">No SOS events recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sosEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`card p-4 ${event.status === 'active' ? 'border-danger-300 bg-danger-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        event.status === 'active' ? 'bg-danger-100 text-danger-600' : 'bg-success-100 text-success-600'
                      }`}>
                        {event.status === 'active' ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-neutral-800">
                            SOS by {event.triggeredBy}
                          </h4>
                          <span className={`badge ${event.status === 'active' ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'}`}>
                            {event.status === 'active' ? 'Active' : 'Resolved'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Triggered: {formatDateTime(event.timestamp)}
                        </p>
                        {event.resolvedAt && (
                          <p className="text-xs text-neutral-500">
                            Resolved: {formatDateTime(event.resolvedAt)} by {event.resolvedBy}
                          </p>
                        )}
                        {event.note && (
                          <p className="text-sm text-neutral-600 mt-2 bg-neutral-50 rounded-lg p-2.5">
                            {event.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="py-6">
        <Disclaimer />
      </footer>

      {/* Modals */}
      {showAddMed && <AddMedicineModal onClose={() => setShowAddMed(false)} />}
      {showAddAppt && <AddAppointmentModal onClose={() => setShowAddAppt(false)} />}
      {showSummary && (
        <SummaryModal
          appointmentId={showSummary}
          doctorName={appointments.find((a) => a.id === showSummary)?.doctorName ?? ''}
          onClose={() => setShowSummary(null)}
        />
      )}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
