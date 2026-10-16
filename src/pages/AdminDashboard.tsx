import { useState } from 'react';
import {
  Users, ShieldCheck, BarChart3, CheckCircle2, XCircle,
  User, AlertTriangle, Pill, Calendar, Heart, TrendingUp,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/data/mockData';
import DashboardHeader from '@/components/DashboardHeader';
import Disclaimer from '@/components/Disclaimer';
import BridgeyHero from '@/components/BridgeyHero';
import SharedTimeline from '@/components/SharedTimeline';
import SOSBanner from '@/components/SOSBanner';

interface AdminDashboardProps {
  onBack: () => void;
}

type Tab = 'users' | 'verification' | 'stats';

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const {
    adminUsers, approveUser, rejectUser,
    caregivers, approveCaregiver, rejectCaregiver,
    medicines, appointments, sosEvents, careCircle,
    runDemoAction, runDemoSOSAction, timelineEvents,
  } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [demoAction, setDemoAction] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleDemoAction = async (action: 'demo_make_next_dose_due' | 'demo_force_dose_missed' | 'reset_demo_data') => {
    if (action === 'reset_demo_data' && !window.confirm('Reset today’s demo doses and their generated events?')) return;
    setDemoAction(action);
    setDemoError(null);
    try {
      await runDemoAction(action);
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : 'Unable to run the demo action.');
    } finally {
      setDemoAction(null);
    }
  };

  const handleDemoSOSAction = async (action: 'demo_trigger_sos' | 'demo_escalate_sos') => {
    setDemoAction(action);
    setDemoError(null);
    try {
      await runDemoSOSAction(action);
    } catch (error) {
      console.error('Unable to run SOS demo action:', error);
      const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Unable to run the SOS demo action.';
      setDemoError(message);
    } finally {
      setDemoAction(null);
    }
  };

  const pendingCaregivers = caregivers.filter((c) => !c.verified);
  const activeUsers = adminUsers.filter((u) => u.status === 'active');
  const pendingUsers = adminUsers.filter((u) => u.status === 'pending');
  const activeSOSCount = sosEvents.filter((s) => ['active', 'acknowledged', 'escalated'].includes(s.status)).length;

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'verification', label: 'Verification', icon: ShieldCheck },
  ];

  const stats = [
    { label: 'Total Users', value: adminUsers.length, icon: Users, color: 'primary' },
    { label: 'Active Users', value: activeUsers.length, icon: CheckCircle2, color: 'success' },
    { label: 'Pending Approvals', value: pendingUsers.length, icon: User, color: 'warning' },
    { label: 'Active SOS Events', value: activeSOSCount, icon: AlertTriangle, color: 'danger' },
    { label: 'Medicines Tracked', value: medicines.length, icon: Pill, color: 'primary' },
    { label: 'Appointments', value: appointments.length, icon: Calendar, color: 'secondary' },
    { label: 'SOS Events (Total)', value: sosEvents.length, icon: AlertTriangle, color: 'danger' },
    { label: 'Care Circle Members', value: careCircle.length, icon: Heart, color: 'accent' },
  ];

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-bg-dark">
      <DashboardHeader
        role="admin"
        title="Admin Panel"
        subtitle="Platform management & oversight"
        onBack={onBack}
      />

      <div className="lg:ml-64 max-w-7xl mx-auto px-6 md:px-12 pt-6">
        <BridgeyHero
          eyebrow="Platform pulse"
          message={pendingCaregivers.length > 0 ? `${pendingCaregivers.length} caregiver${pendingCaregivers.length === 1 ? '' : 's'} waiting for verification.` : 'Everything is up to date on the platform.'}
          expression={pendingCaregivers.length > 0 ? 'concerned' : 'happy'}
        />
      </div>

      <div className="lg:ml-64 max-w-7xl mx-auto px-6 md:px-12 py-6">
        <div className="mb-6"><SOSBanner /></div>
        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto border-b border-neutral-200 mb-6">
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
              {tab.id === 'verification' && pendingCaregivers.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-warning-500 text-white text-xs font-bold">
                  {pendingCaregivers.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="card p-5">
                  <div className={`w-11 h-11 rounded-xl bg-${stat.color}-100 text-${stat.color}-600 flex items-center justify-center mb-3`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <p className="font-display font-bold text-3xl text-neutral-800">{stat.value}</p>
                  <p className="text-xs text-neutral-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Caregiver verification overview */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-neutral-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Caregiver Verification Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-success-50 border border-success-200 rounded-xl p-4">
                  <p className="font-display font-bold text-2xl text-success-700">
                    {caregivers.filter((c) => c.verified).length}
                  </p>
                  <p className="text-sm text-success-600">Verified Caregivers</p>
                </div>
                <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
                  <p className="font-display font-bold text-2xl text-warning-700">
                    {pendingCaregivers.length}
                  </p>
                  <p className="text-sm text-warning-600">Pending Verification</p>
                </div>
              </div>
            </div>

            <section className="card p-5" aria-labelledby="demo-tools-title">
              <h3 id="demo-tools-title" className="font-display font-bold text-base text-neutral-800 mb-4">Demo tools</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={demoAction !== null}
                  onClick={() => void handleDemoAction('demo_make_next_dose_due')}
                  className="btn-primary disabled:opacity-50"
                >
                  Make next dose due now
                </button>
                <button
                  type="button"
                  disabled={demoAction !== null}
                  onClick={() => void handleDemoAction('demo_force_dose_missed')}
                  className="px-4 py-2.5 rounded-xl bg-warning-500 text-white font-semibold text-sm hover:bg-warning-600 disabled:opacity-50"
                >
                  Force dose to missed
                </button>
                <button
                  type="button"
                  disabled={demoAction !== null}
                  onClick={() => void handleDemoAction('reset_demo_data')}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-semibold text-sm hover:bg-neutral-50 disabled:opacity-50"
                >
                  Reset demo data
                </button>
                <button
                  type="button"
                  disabled={demoAction !== null}
                  onClick={() => void handleDemoSOSAction('demo_trigger_sos')}
                  className="px-4 py-2.5 rounded-xl bg-danger-600 text-white font-semibold text-sm hover:bg-danger-700 disabled:opacity-50"
                >
                  Trigger test SOS
                </button>
                <button
                  type="button"
                  disabled={demoAction !== null}
                  onClick={() => void handleDemoSOSAction('demo_escalate_sos')}
                  className="px-4 py-2.5 rounded-xl border border-danger-300 text-danger-700 font-semibold text-sm hover:bg-danger-50 disabled:opacity-50"
                >
                  Skip to escalation
                </button>
              </div>
              {demoAction && <p className="text-xs text-neutral-500 mt-3">Running demo action…</p>}
              {demoError && <p role="alert" className="text-sm text-danger-600 mt-3">{demoError}</p>}
            </section>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-display font-bold text-lg text-neutral-800">User List</h3>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide px-4 py-3">Name</th>
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Email</th>
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide px-4 py-3">Role</th>
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Joined</th>
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((user) => (
                      <tr key={user.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-neutral-800">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500 hidden sm:table-cell">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">{user.role}</td>
                        <td className="px-4 py-3 text-sm text-neutral-500 hidden sm:table-cell">{formatDate(user.joinedDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${user.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-6 animate-fade-in">
            {/* Pending users */}
            {pendingUsers.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-800 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-warning-500" />
                  Pending User Approvals
                </h3>
                <div className="space-y-3">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="card p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning-100 text-warning-600 flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-neutral-800">{user.name}</p>
                        <p className="text-xs text-neutral-500">{user.email} · {user.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveUser(user.id)}
                          className="px-3 py-1.5 rounded-lg bg-success-500 text-white text-xs font-semibold hover:bg-success-600 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectUser(user.id)}
                          className="px-3 py-1.5 rounded-lg bg-danger-100 text-danger-600 text-xs font-semibold hover:bg-danger-200 transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caregiver verification */}
            <div>
              <h3 className="font-display font-bold text-lg text-neutral-800 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-secondary-500" />
                Caregiver Verification
              </h3>
              {pendingCaregivers.length === 0 ? (
                <div className="card p-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-success-500 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600 font-medium">All caregivers verified</p>
                  <p className="text-xs text-neutral-400 mt-1">No pending verifications.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCaregivers.map((cg) => (
                    <div key={cg.id} className="card p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center font-bold">
                        {cg.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-neutral-800">{cg.name}</p>
                        <p className="text-xs text-neutral-500">
                          {cg.specialty} · {cg.location} · Rating: {cg.rating}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveCaregiver(cg.id)}
                          className="px-3 py-1.5 rounded-lg bg-success-500 text-white text-xs font-semibold hover:bg-success-600 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectCaregiver(cg.id)}
                          className="px-3 py-1.5 rounded-lg bg-danger-100 text-danger-600 text-xs font-semibold hover:bg-danger-200 transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-8">
          <SharedTimeline events={timelineEvents} />
        </div>
      </div>

      <footer className="py-6">
        <Disclaimer />
      </footer>
    </div>
  );
}
