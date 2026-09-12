import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  type Medicine,
  type Appointment,
  type SOSEvent,
  type TimelineEntry,
  type Caregiver,
  type CareCircleMember,
  type CaregiverTask,
  type AdminUser,
  type Role,
  seedMedicines,
  seedAppointments,
  seedSOSEvents,
  seedTimeline,
  seedCaregivers,
  seedCareCircle,
  seedCaregiverTasks,
  seedAdminUsers,
  formatClockTime,
} from '@/data/mockData';

interface AppContextValue {
  // Role
  currentRole: Role | null;
  setCurrentRole: (role: Role | null) => void;
  bridgeySection: string;
  setBridgeySection: (section: string) => void;
  bridgeyEvent: { type: 'medicine-taken' | 'medicines-complete' | 'appointment-added' | 'caregiver-added' | 'task-completed' | 'sos-triggered' | 'sos-resolved'; id: number } | null;
  sosConfirmationOpen: boolean;
  setSosConfirmationOpen: (open: boolean) => void;

  // Medicines
  medicines: Medicine[];
  markMedicineTaken: (id: string) => void;
  simulateMissedDose: (id: string) => void;
  addMedicine: (med: Omit<Medicine, 'id' | 'status'>) => void;

  // Appointments
  appointments: Appointment[];
  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  addAppointmentSummary: (id: string, summary: string) => void;

  // SOS
  sosEvents: SOSEvent[];
  triggerSOS: () => void;
  resolveSOS: (id: string, resolvedBy: string) => void;
  activeSOS: SOSEvent | null;

  // Timeline
  timeline: TimelineEntry[];
  addTimelineEntry: (entry: Omit<TimelineEntry, 'id'>) => void;

  // Caregivers
  caregivers: Caregiver[];
  requestCaregiver: (id: string) => void;

  // Care Circle
  careCircle: CareCircleMember[];
  inviteFamilyMember: (name: string, email: string, role: string, location: string) => void;

  // Caregiver Tasks
  caregiverTasks: CaregiverTask[];
  toggleTask: (id: string) => void;

  // Admin
  adminUsers: AdminUser[];
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;

  // Caregiver verification
  approveCaregiver: (id: string) => void;
  rejectCaregiver: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function getStoredRole(): Role | null {
  const role = window.sessionStorage.getItem('carebridge-active-role');
  return role === 'elderly' || role === 'family' || role === 'caregiver' || role === 'admin' ? role : null;
}

let idCounter = 1000;
function genId(prefix: string): string {
  idCounter++;
  return `${prefix}${idCounter}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRoleState] = useState<Role | null>(getStoredRole);
  const [bridgeySection, setBridgeySection] = useState('landing');
  const [bridgeyEvent, setBridgeyEvent] = useState<AppContextValue['bridgeyEvent']>(null);
  const [sosConfirmationOpen, setSosConfirmationOpen] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>(seedMedicines);
  const [appointments, setAppointments] = useState<Appointment[]>(seedAppointments);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>(seedSOSEvents);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(seedTimeline);
  const [caregivers, setCaregivers] = useState<Caregiver[]>(seedCaregivers);
  const [careCircle, setCareCircle] = useState<CareCircleMember[]>(seedCareCircle);
  const [caregiverTasks, setCaregiverTasks] = useState<CaregiverTask[]>(seedCaregiverTasks);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(seedAdminUsers);

  const activeSOS = sosEvents.find((s) => s.status === 'active') ?? null;

  const setCurrentRole = useCallback((role: Role | null) => {
    setCurrentRoleState(role);
    if (role) window.sessionStorage.setItem('carebridge-active-role', role);
    else window.sessionStorage.removeItem('carebridge-active-role');
  }, []);

  const addTimelineEntry = useCallback((entry: Omit<TimelineEntry, 'id'>) => {
    const newEntry: TimelineEntry = { ...entry, id: genId('t') };
    setTimeline((prev) => [newEntry, ...prev]);
  }, []);

  const markMedicineTaken = useCallback(
    (id: string) => {
      setMedicines((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'taken' as const } : m))
      );
      const med = medicines.find((m) => m.id === id);
      if (med) {
        const allMedicinesTaken = medicines.length > 0 && medicines.every((medicine) =>
          medicine.id === id || medicine.status === 'taken'
        );
        setBridgeyEvent({ type: allMedicinesTaken ? 'medicines-complete' : 'medicine-taken', id: Date.now() });
        addTimelineEntry({
          type: 'medicine',
          title: `${med.name} ${med.dosage} taken`,
          description: `Dose taken at ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}.`,
          timestamp: new Date().toISOString(),
          status: 'taken',
        });
      }
    },
    [medicines, addTimelineEntry]
  );

  const simulateMissedDose = useCallback(
    (id: string) => {
      setMedicines((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'missed' as const } : m))
      );
      const med = medicines.find((m) => m.id === id);
      if (med) {
        addTimelineEntry({
          type: 'medicine',
          title: `${med.name} ${med.dosage} missed`,
          description: `Scheduled dose was not taken on time.`,
          timestamp: new Date().toISOString(),
          status: 'missed',
        });
      }
    },
    [medicines, addTimelineEntry]
  );

  const addMedicine = useCallback(
    (med: Omit<Medicine, 'id' | 'status'>) => {
      const newMed: Medicine = { ...med, id: genId('m'), status: 'pending' };
      setMedicines((prev) => [...prev, newMed]);
      addTimelineEntry({
        type: 'medicine',
        title: `New medicine added: ${med.name} ${med.dosage}`,
        description: `${med.frequency} at ${med.times.map(formatClockTime).join(', ')}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
      });
    },
    [addTimelineEntry]
  );

  const addAppointment = useCallback(
    (appt: Omit<Appointment, 'id'>) => {
      const newAppt: Appointment = { ...appt, id: genId('a') };
      setAppointments((prev) =>
        [...prev, newAppt].sort((a, b) => a.date.localeCompare(b.date))
      );
      setBridgeyEvent({ type: 'appointment-added', id: Date.now() });
      addTimelineEntry({
        type: 'appointment',
        title: `Appointment scheduled: ${appt.doctorName}`,
        description: `${appt.specialty} on ${appt.date} at ${formatClockTime(appt.time)}, ${appt.location}`,
        timestamp: new Date().toISOString(),
        status: 'upcoming',
      });
    },
    [addTimelineEntry]
  );

  const addAppointmentSummary = useCallback(
    (id: string, summary: string) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, summary } : a))
      );
      const appt = appointments.find((a) => a.id === id);
      if (appt) {
        addTimelineEntry({
          type: 'appointment',
          title: `Post-visit notes added: ${appt.doctorName}`,
          description: summary,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [appointments, addTimelineEntry]
  );

  const triggerSOS = useCallback(() => {
    const newEvent: SOSEvent = {
      id: genId('s'),
      timestamp: new Date().toISOString(),
      triggeredBy: 'Venkat Rao',
      status: 'active',
    };
    setSosEvents((prev) => [newEvent, ...prev]);
    setBridgeyEvent({ type: 'sos-triggered', id: Date.now() });
    addTimelineEntry({
      type: 'sos',
      title: 'SOS Alert Triggered',
      description: 'Emergency SOS activated by Venkat Rao.',
      timestamp: newEvent.timestamp,
      status: 'active',
    });
  }, [addTimelineEntry]);

  const resolveSOS = useCallback(
    (id: string, resolvedBy: string) => {
      const resolvedAt = new Date().toISOString();
      setSosEvents((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: 'resolved' as const, resolvedAt, resolvedBy } : s
        )
      );
      setBridgeyEvent({ type: 'sos-resolved', id: Date.now() });
      addTimelineEntry({
        type: 'sos',
        title: 'SOS Resolved',
        description: `Emergency resolved by ${resolvedBy}.`,
        timestamp: resolvedAt,
        status: 'resolved',
      });
    },
    [addTimelineEntry]
  );

  const requestCaregiver = useCallback(
    (id: string) => {
      setCaregivers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, inCareCircle: true } : c))
      );
      const cg = caregivers.find((c) => c.id === id);
      if (cg) {
        setCareCircle((prev) => [
          ...prev,
          {
            id: cg.id,
            name: cg.name,
            role: 'Caregiver',
            location: cg.location,
            type: 'caregiver' as const,
          },
        ]);
        setBridgeyEvent({ type: 'caregiver-added', id: Date.now() });
        addTimelineEntry({
          type: 'caregiver',
          title: `Caregiver added: ${cg.name}`,
          description: `${cg.specialty} from ${cg.location} added to Care Circle.`,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [caregivers, addTimelineEntry]
  );

  const inviteFamilyMember = useCallback(
    (name: string, email: string, role: string, location: string) => {
      const id = genId('f');
      setCareCircle((prev) => [
        ...prev,
        { id, name, role, location, type: 'family' as const },
      ]);
      addTimelineEntry({
        type: 'note',
        title: `Family member invited: ${name}`,
        description: `${role} in ${location} invited to the Care Circle.`,
        timestamp: new Date().toISOString(),
      });
    },
    [addTimelineEntry]
  );

  const toggleTask = useCallback((id: string) => {
    const task = caregiverTasks.find((item) => item.id === id);
    if (task && !task.done) setBridgeyEvent({ type: 'task-completed', id: Date.now() });
    setCaregiverTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, [caregiverTasks]);

  const approveUser = useCallback((id: string) => {
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'active' as const } : u))
    );
  }, []);

  const rejectUser = useCallback((id: string) => {
    setAdminUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const approveCaregiver = useCallback((id: string) => {
    setCaregivers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, verified: true } : c))
    );
  }, []);

  const rejectCaregiver = useCallback((id: string) => {
    setCaregivers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value: AppContextValue = {
    currentRole,
    setCurrentRole,
    bridgeySection,
    setBridgeySection,
    bridgeyEvent,
    sosConfirmationOpen,
    setSosConfirmationOpen,
    medicines,
    markMedicineTaken,
    simulateMissedDose,
    addMedicine,
    appointments,
    addAppointment,
    addAppointmentSummary,
    sosEvents,
    triggerSOS,
    resolveSOS,
    activeSOS,
    timeline,
    addTimelineEntry,
    caregivers,
    requestCaregiver,
    careCircle,
    inviteFamilyMember,
    caregiverTasks,
    toggleTask,
    adminUsers,
    approveUser,
    rejectUser,
    approveCaregiver,
    rejectCaregiver,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
