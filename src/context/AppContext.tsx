import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/supabaseClient';
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
  profile: UserProfile | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  currentRole: Role | null;
  bridgeySection: string;
  setBridgeySection: (section: string) => void;
  bridgeyEvent: { type: 'medicine-taken' | 'medicines-complete' | 'appointment-added' | 'caregiver-added' | 'task-completed' | 'sos-triggered' | 'sos-resolved'; id: number } | null;
  sosConfirmationOpen: boolean;
  setSosConfirmationOpen: (open: boolean) => void;

  // Medicines
  medicines: Medicine[];
  doses: CareDose[];
  careLoading: boolean;
  careError: string | null;
  refreshCareData: () => Promise<void>;
  confirmDose: (doseId: string) => Promise<void>;
  addMedicine: (med: Pick<Medicine, 'name' | 'dosage' | 'times'>) => Promise<void>;
  updateMedicine: (id: string, med: Pick<Medicine, 'name' | 'dosage' | 'times'>) => Promise<void>;
  notifications: CareNotification[];
  timelineEvents: CareTimelineEvent[];
  addCareTimelineEvent: (type: string, message: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  runDemoAction: (action: 'demo_make_next_dose_due' | 'demo_force_dose_missed' | 'reset_demo_data') => Promise<void>;

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

export interface UserProfile {
  id: string;
  full_name: string;
  role: Role;
  care_circle_id: string | null;
}

export type DoseStatus = 'scheduled' | 'due' | 'taken' | 'missed' | 'taken_late';

export interface CareDose {
  id: string;
  medicine_id: string;
  scheduled_at: string;
  status: DoseStatus;
  confirmed_at: string | null;
  medicine_name: string;
  medicine_dosage: string;
}

export interface CareNotification {
  id: string;
  type: string;
  message: string;
  linked_id: string | null;
  read: boolean;
  created_at: string;
}

export interface CareTimelineEvent {
  id: string;
  type: string;
  message: string;
  linked_id: string | null;
  created_at: string;
}

async function loadProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, care_circle_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No CareBridge profile is linked to this account.');
  }

  return data as UserProfile;
}

let idCounter = 1000;
function genId(prefix: string): string {
  idCounter++;
  return `${prefix}${idCounter}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bridgeySection, setBridgeySection] = useState('landing');
  const [bridgeyEvent, setBridgeyEvent] = useState<AppContextValue['bridgeyEvent']>(null);
  const [sosConfirmationOpen, setSosConfirmationOpen] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doses, setDoses] = useState<CareDose[]>([]);
  const [notifications, setNotifications] = useState<CareNotification[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<CareTimelineEvent[]>([]);
  const [careLoading, setCareLoading] = useState(false);
  const [careError, setCareError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>(seedAppointments);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>(seedSOSEvents);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(seedTimeline);
  const [caregivers, setCaregivers] = useState<Caregiver[]>(seedCaregivers);
  const [careCircle, setCareCircle] = useState<CareCircleMember[]>(seedCareCircle);
  const [caregiverTasks, setCaregiverTasks] = useState<CaregiverTask[]>(seedCaregiverTasks);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(seedAdminUsers);

  const activeSOS = sosEvents.find((s) => s.status === 'active') ?? null;

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setAuthLoading(false);
      } else {
        setAuthLoading(true);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setSession(error ? null : data.session);
      if (error || !data.session) setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setAuthLoading(false);
      return;
    }

    let active = true;
    loadProfile(session.user.id)
      .then((nextProfile) => {
        if (active) setProfile(nextProfile);
      })
      .catch(() => {
        if (active) setProfile(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user || !data.session) throw new Error('Supabase did not return an authenticated user.');

    try {
      const nextProfile = await loadProfile(data.user.id);
      const { error: auditError } = await supabase.from('audit_log').insert({
        actor: data.user.id,
        action: 'login',
        target: `profile:${data.user.id}`,
        is_demo: email.trim().toLowerCase().endsWith('@demo.com'),
      });
      if (auditError) throw auditError;
      setSession(data.session);
      setProfile(nextProfile);
      setAuthLoading(false);
    } catch (error) {
      await supabase.auth.signOut();
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setProfile(null);
  }, []);

  const currentRole = profile?.role ?? null;
  const refreshCareData = useCallback(async () => {
    if (!profile?.care_circle_id) return;

    const { error: generateError } = await supabase.rpc('generate_todays_doses');
    if (generateError) throw generateError;
    const { error: refreshError } = await supabase.rpc('refresh_dose_states');
    if (refreshError) throw refreshError;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [medicineResult, doseResult, notificationResult, timelineResult] = await Promise.all([
      supabase.from('medicines').select('id, name, dosage, times').order('created_at'),
      supabase
        .from('doses')
        .select('id, medicine_id, scheduled_at, status, confirmed_at')
        .gte('scheduled_at', start.toISOString())
        .lt('scheduled_at', end.toISOString())
        .order('scheduled_at'),
      supabase.from('notifications').select('id, type, message, linked_id, read, created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('timeline_events').select('id, type, message, linked_id, created_at').order('created_at', { ascending: false }).limit(100),
    ]);

    const queryError = medicineResult.error ?? doseResult.error ?? notificationResult.error ?? timelineResult.error;
    if (queryError) throw queryError;

    const medicineRows = medicineResult.data ?? [];
    const medicineById = new Map(medicineRows.map((medicine) => [medicine.id, medicine]));
    const doseRows = (doseResult.data ?? []).map((dose) => {
      const medicine = medicineById.get(dose.medicine_id);
      return {
        ...dose,
        status: dose.status as DoseStatus,
        medicine_name: medicine?.name ?? 'Medicine',
        medicine_dosage: medicine?.dosage ?? '',
      };
    });
    const dosesByMedicine = new Map<string, CareDose[]>();
    for (const dose of doseRows) {
      const medicineDoses = dosesByMedicine.get(dose.medicine_id) ?? [];
      medicineDoses.push(dose);
      dosesByMedicine.set(dose.medicine_id, medicineDoses);
    }

    setDoses(doseRows);
    setMedicines(medicineRows.map((medicine) => {
      const medicineDoses = dosesByMedicine.get(medicine.id) ?? [];
      const status = medicineDoses.length > 0 && medicineDoses.every((dose) => dose.status === 'taken' || dose.status === 'taken_late')
        ? 'taken'
        : medicineDoses.some((dose) => dose.status === 'missed')
          ? 'missed'
          : 'pending';
      return {
        ...medicine,
        frequency: medicine.times.length === 1 ? 'Once daily' : `${medicine.times.length} times daily`,
        times: medicine.times,
        status,
      };
    }));
    setNotifications((notificationResult.data ?? []) as CareNotification[]);
    setTimelineEvents((timelineResult.data ?? []) as CareTimelineEvent[]);
    setCareError(null);
  }, [profile?.care_circle_id]);

  useEffect(() => {
    if (!profile?.care_circle_id) {
      setMedicines([]);
      setDoses([]);
      setNotifications([]);
      setTimelineEvents([]);
      setCareError(null);
      return;
    }

    let active = true;
    const load = async () => {
      setCareLoading(true);
      try {
        await refreshCareData();
      } catch (error) {
        if (active) setCareError(error instanceof Error ? error.message : 'Unable to load care data.');
      } finally {
        if (active) setCareLoading(false);
      }
    };
    void load();
    const intervalId = window.setInterval(() => void load(), 15_000);
    const channel = supabase
      .channel(`care-data-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doses' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timeline_events' }, () => void load())
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(intervalId);
      void supabase.removeChannel(channel);
    };
  }, [profile?.care_circle_id, profile?.id, refreshCareData]);

  const confirmDose = useCallback(async (doseId: string) => {
    const { error } = await supabase.rpc('confirm_dose', { dose_id: doseId });
    if (error) throw error;
    await refreshCareData();
  }, [refreshCareData]);

  const addMedicine = useCallback(async (medicine: Pick<Medicine, 'name' | 'dosage' | 'times'>) => {
    if (!profile?.care_circle_id) throw new Error('No care circle is linked to this account.');
    const { error } = await supabase.from('medicines').insert({
      care_circle_id: profile.care_circle_id,
      name: medicine.name,
      dosage: medicine.dosage,
      times: medicine.times,
      created_by: profile.id,
    });
    if (error) throw error;
    await refreshCareData();
  }, [profile?.care_circle_id, profile?.id, refreshCareData]);

  const updateMedicine = useCallback(async (id: string, medicine: Pick<Medicine, 'name' | 'dosage' | 'times'>) => {
    const { error } = await supabase.from('medicines').update({
      name: medicine.name,
      dosage: medicine.dosage,
      times: medicine.times,
    }).eq('id', id);
    if (error) throw error;
    await refreshCareData();
  }, [refreshCareData]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    if (error) throw error;
    setNotifications((previous) => previous.map((item) => item.id === notificationId ? { ...item, read: true } : item));
  }, []);

  const addCareTimelineEvent = useCallback(async (type: string, message: string) => {
    if (!profile?.care_circle_id) throw new Error('No care circle is linked to this account.');
    const { error } = await supabase.from('timeline_events').insert({
      care_circle_id: profile.care_circle_id,
      type,
      message,
    });
    if (error) throw error;
    await refreshCareData();
  }, [profile?.care_circle_id, refreshCareData]);

  const runDemoAction = useCallback(async (action: 'demo_make_next_dose_due' | 'demo_force_dose_missed' | 'reset_demo_data') => {
    const { error } = await supabase.rpc(action);
    if (error) throw error;
    await refreshCareData();
  }, [refreshCareData]);

  const addTimelineEntry = useCallback((entry: Omit<TimelineEntry, 'id'>) => {
    const newEntry: TimelineEntry = { ...entry, id: genId('t') };
    setTimeline((prev) => [newEntry, ...prev]);
  }, []);

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
    profile,
    authLoading,
    signIn,
    signOut,
    currentRole,
    bridgeySection,
    setBridgeySection,
    bridgeyEvent,
    sosConfirmationOpen,
    setSosConfirmationOpen,
    medicines,
    doses,
    careLoading,
    careError,
    refreshCareData,
    confirmDose,
    addMedicine,
    updateMedicine,
    notifications,
    timelineEvents,
    addCareTimelineEvent,
    markNotificationRead,
    runDemoAction,
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
