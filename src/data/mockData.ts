// ─── Types ──────────────────────────────────────────────
export type Role = 'elderly' | 'family' | 'caregiver' | 'admin';

export type MedicineStatus = 'taken' | 'pending' | 'missed';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[]; // e.g. ["08:00", "20:00"]
  status: MedicineStatus;
  notes?: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string; // ISO date
  time: string;
  location: string;
  notes: string;
  summary?: string;
}

export type SOSSstatus = 'active' | 'acknowledged' | 'escalated' | 'resolved' | 'cancelled';

export interface SOSEvent {
  id: string;
  careCircleId: string;
  timestamp: string; // ISO
  triggeredBy: string;
  triggeredById: string;
  status: SOSSstatus;
  latitude: number | null;
  longitude: number | null;
  acknowledgedBy: string | null;
  acknowledgedAt?: string;
  responderName?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  resolvedById: string | null;
  resolvedBy?: string;
  notifiedMembers: string[];
  note?: string;
}

export type TimelineEntryType = 'medicine' | 'appointment' | 'sos' | 'note' | 'caregiver';

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  title: string;
  description: string;
  timestamp: string; // ISO
  status?: MedicineStatus | SOSSstatus | string;
}

export interface Caregiver {
  id: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  availability: boolean;
  verified: boolean;
  phone: string;
  inCareCircle: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  location: string;
  avatar?: string;
}

export interface CareCircleMember {
  id: string;
  name: string;
  role: string;
  location?: string;
  type: Role;
}

export interface CaregiverTask {
  id: string;
  title: string;
  description: string;
  time: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending';
  joinedDate: string;
}

// ─── Seed Data ──────────────────────────────────────────

export const elderlyPerson = {
  id: 'e1',
  name: 'Venkat Rao',
  age: 68,
  location: 'Vijayawada',
  phone: '+91 98765 43210',
};

export const familyMember = {
  id: 'f1',
  name: 'Ravi Rao',
  location: 'Hyderabad',
  phone: '+91 90000 12345',
  relation: 'Son',
};

export const primaryCaregiver = {
  id: 'c1',
  name: 'Lakshmi Devi',
  specialty: 'Elder Care & Nursing',
  location: 'Vijayawada',
  rating: 4.8,
  availability: true,
  verified: true,
  phone: '+91 98480 11223',
  inCareCircle: true,
};

export const seedMedicines: Medicine[] = [
  {
    id: 'm1',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    times: ['08:00', '20:00'],
    status: 'pending',
    notes: 'After meals',
  },
  {
    id: 'm2',
    name: 'Amlodipine',
    dosage: '5mg',
    frequency: 'Once daily',
    times: ['09:00'],
    status: 'pending',
    notes: 'Morning, before breakfast',
  },
  {
    id: 'm3',
    name: 'Atorvastatin',
    dosage: '10mg',
    frequency: 'Once daily',
    times: ['21:00'],
    status: 'pending',
    notes: 'At night',
  },
  {
    id: 'm4',
    name: 'Aspirin',
    dosage: '75mg',
    frequency: 'Once daily',
    times: ['08:00'],
    status: 'taken',
    notes: 'After breakfast',
  },
];

export const seedAppointments: Appointment[] = [
  {
    id: 'a1',
    doctorName: 'Dr. Suresh Reddy',
    specialty: 'Cardiology',
    date: '2026-09-14',
    time: '11:30',
    location: 'Care Hospital, Vijayawada',
    notes: 'Follow-up for blood pressure monitoring. Bring previous prescriptions.',
  },
  {
    id: 'a2',
    doctorName: 'Dr. Anitha Krishnan',
    specialty: 'General Physician',
    date: '2026-09-15',
    time: '10:00',
    location: 'Sri Sai Clinic, Benz Circle',
    notes: 'Routine checkup and diabetes review.',
  },
  {
    id: 'a3',
    doctorName: 'Dr. Pradeep Kumar',
    specialty: 'Ophthalmology',
    date: '2026-09-20',
    time: '15:00',
    location: 'Vasan Eye Care, MG Road',
    notes: 'Annual eye examination.',
  },
];

export const seedSOSEvents: SOSEvent[] = [
  {
    id: 's1',
    careCircleId: 'demo-circle',
    timestamp: '2026-09-08T14:30:00',
    triggeredBy: 'Venkat Rao',
    triggeredById: 'e1',
    status: 'resolved',
    latitude: null,
    longitude: null,
    acknowledgedBy: 'f1',
    acknowledgedAt: '2026-09-08T14:35:00',
    responderName: 'Ravi Rao',
    resolvedById: 'f1',
    resolvedAt: '2026-09-08T14:45:00',
    resolvedBy: 'Ravi Rao',
    notifiedMembers: [],
    note: 'Fell in the bathroom. Neighbour helped. Family was alerted immediately.',
  },
  {
    id: 's2',
    careCircleId: 'demo-circle',
    timestamp: '2026-09-03T19:15:00',
    triggeredBy: 'Venkat Rao',
    triggeredById: 'e1',
    status: 'resolved',
    latitude: null,
    longitude: null,
    acknowledgedBy: 'c1',
    acknowledgedAt: '2026-09-03T19:20:00',
    responderName: 'Lakshmi Devi',
    resolvedById: 'c1',
    resolvedAt: '2026-09-03T19:50:00',
    resolvedBy: 'Lakshmi Devi',
    notifiedMembers: [],
    note: 'Severe chest pain. Caregiver attended and called doctor.',
  },
];

export const seedTimeline: TimelineEntry[] = [
  {
    id: 't1',
    type: 'sos',
    title: 'SOS Resolved',
    description: 'Bathroom fall — neighbour assisted, family alerted.',
    timestamp: '2026-09-08T14:45:00',
    status: 'resolved',
  },
  {
    id: 't2',
    type: 'medicine',
    title: 'Aspirin 75mg taken',
    description: 'Morning dose taken at 8:05 AM.',
    timestamp: '2026-09-12T08:05:00',
    status: 'taken',
  },
  {
    id: 't3',
    type: 'appointment',
    title: 'Cardiology follow-up scheduled',
    description: 'Dr. Suresh Reddy on Sept 14 at 11:30 AM, Care Hospital.',
    timestamp: '2026-09-10T10:00:00',
    status: 'upcoming',
  },
  {
    id: 't4',
    type: 'note',
    title: 'Blood pressure log',
    description: 'BP reading: 130/85 mmHg. Within normal range.',
    timestamp: '2026-09-11T07:30:00',
  },
];

export const seedCaregivers: Caregiver[] = [
  {
    id: 'c1',
    name: 'Lakshmi Devi',
    specialty: 'Elder Care & Nursing',
    location: 'Vijayawada',
    rating: 4.8,
    availability: true,
    verified: true,
    phone: '+91 98480 11223',
    inCareCircle: true,
  },
  {
    id: 'c2',
    name: 'Saritha Reddy',
    specialty: 'Physiotherapy & Mobility',
    location: 'Vijayawada',
    rating: 4.6,
    availability: true,
    verified: false,
    phone: '+91 90500 33445',
    inCareCircle: false,
  },
  {
    id: 'c3',
    name: 'Mohammed Iqbal',
    specialty: 'Home Nursing & Wound Care',
    location: 'Vijayawada',
    rating: 4.9,
    availability: false,
    verified: true,
    phone: '+91 97000 55667',
    inCareCircle: false,
  },
  {
    id: 'c4',
    name: 'Priya Nair',
    specialty: 'Dementia & Companion Care',
    location: 'Guntur',
    rating: 4.5,
    availability: true,
    verified: false,
    phone: '+91 91200 77889',
    inCareCircle: false,
  },
];

export const seedCareCircle: CareCircleMember[] = [
  {
    id: 'f1',
    name: 'Ravi Rao',
    role: 'Son',
    location: 'Hyderabad',
    type: 'family',
  },
  {
    id: 'f2',
    name: 'Saritha Rao',
    role: 'Daughter',
    location: 'Bengaluru',
    type: 'family',
  },
  {
    id: 'c1',
    name: 'Lakshmi Devi',
    role: 'Primary Caregiver',
    location: 'Vijayawada',
    type: 'caregiver',
  },
];

export const seedCaregiverTasks: CaregiverTask[] = [
  {
    id: 'ct1',
    title: 'Morning medication assistance',
    description: 'Help Venkat Rao take Metformin and Amlodipine after breakfast.',
    time: '08:00',
    done: false,
    priority: 'high',
  },
  {
    id: 'ct2',
    title: 'Blood pressure check',
    description: 'Record BP and log the reading in the health notes.',
    time: '09:00',
    done: false,
    priority: 'medium',
  },
  {
    id: 'ct3',
    title: 'Evening walk assistance',
    description: 'Accompany for a 20-minute walk in the park.',
    time: '17:00',
    done: false,
    priority: 'low',
  },
  {
    id: 'ct4',
    title: 'Night medication assistance',
    description: 'Metformin and Atorvastatin after dinner.',
    time: '20:00',
    done: false,
    priority: 'high',
  },
];

export const seedAdminUsers: AdminUser[] = [
  {
    id: 'u1',
    name: 'Venkat Rao',
    email: 'venkat.rao@email.com',
    role: 'Elderly Person',
    status: 'active',
    joinedDate: '2026-08-01',
  },
  {
    id: 'u2',
    name: 'Ravi Rao',
    email: 'ravi.rao@email.com',
    role: 'Family Member',
    status: 'active',
    joinedDate: '2026-08-01',
  },
  {
    id: 'u3',
    name: 'Saritha Rao',
    email: 'saritha.rao@email.com',
    role: 'Family Member',
    status: 'active',
    joinedDate: '2026-08-03',
  },
  {
    id: 'u4',
    name: 'Lakshmi Devi',
    email: 'lakshmi.devi@email.com',
    role: 'Caregiver',
    status: 'active',
    joinedDate: '2026-08-05',
  },
  {
    id: 'u5',
    name: 'Saritha Reddy',
    email: 'saritha.reddy@email.com',
    role: 'Caregiver',
    status: 'pending',
    joinedDate: '2026-09-10',
  },
  {
    id: 'u6',
    name: 'Priya Nair',
    email: 'priya.nair@email.com',
    role: 'Caregiver',
    status: 'pending',
    joinedDate: '2026-09-11',
  },
];

// ─── Helpers ────────────────────────────────────────────

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatClockTime(value: string): string {
  const [hoursText, minutesText] = value.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return value;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function daysUntil(iso: string): number {
  const today = new Date('2026-09-12T00:00:00');
  const target = new Date(iso + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function appointmentBadge(iso: string): { label: string; color: string } {
  const days = daysUntil(iso);
  if (days < 0) return { label: 'Past', color: 'neutral' };
  if (days === 0) return { label: 'Today', color: 'danger' };
  if (days === 1) return { label: 'Tomorrow', color: 'accent' };
  if (days <= 3) return { label: `In ${days} days`, color: 'accent' };
  return { label: `In ${days} days`, color: 'primary' };
}
