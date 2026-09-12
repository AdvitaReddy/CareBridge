import { Heart, Pill, Calendar, AlertTriangle, Users, ArrowRight, ShieldCheck, Clock, Phone } from 'lucide-react';
import Disclaimer from '@/components/Disclaimer';

interface LandingProps {
  onEnter: () => void;
}

export default function Landing({ onEnter }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-secondary-50">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl text-neutral-800">CareBridge</span>
        </div>
        <button
          onClick={onEnter}
          className="px-5 py-2.5 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-12 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6 animate-fade-in">
          <ShieldCheck className="w-4 h-4" />
          Coordinated care for the whole family
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-neutral-800 leading-tight max-w-3xl mx-auto animate-slide-up">
          Caring for your parents,
          <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"> even from afar.</span>
        </h1>
        <p className="text-base sm:text-lg text-neutral-500 mt-6 max-w-2xl mx-auto leading-relaxed animate-slide-up">
          Working professionals in cities like Hyderabad and Bengaluru worry about elderly parents
          living alone in smaller towns. CareBridge unifies medicines, appointments, caregivers, and
          emergencies into one shared platform — so no dose is missed and no call is forgotten.
        </p>
        <button
          onClick={onEnter}
          className="mt-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 mx-auto animate-slide-up"
        >
          Enter App
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Problem */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-800">The problem today</h2>
          <p className="text-neutral-500 mt-3 max-w-xl mx-auto">
            Caregiving is fragmented across phone calls, WhatsApp messages, and handwritten notes.
            Things fall through the cracks.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Pill, title: 'Missed medicines', desc: 'No one knows if a dose was taken or skipped.' },
            { icon: Calendar, title: 'Forgotten appointments', desc: 'Doctor visits are missed because no one reminded them.' },
            { icon: AlertTriangle, title: 'Slow emergencies', desc: 'Precious minutes lost calling family one by one.' },
          ].map((item) => (
            <div key={item.title} className="card p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-danger-100 text-danger-600 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-base text-neutral-800">{item.title}</h3>
              <p className="text-sm text-neutral-500 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-800">
              How CareBridge helps
            </h2>
            <p className="text-neutral-500 mt-3 max-w-xl mx-auto">
              One shared platform for the whole family — with role-based views for everyone involved.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Pill, color: 'primary', title: 'Medicine Management', desc: 'Daily schedule with one-tap "Mark as Taken." Family gets alerted if a dose is missed.' },
              { icon: Calendar, color: 'secondary', title: 'Appointment Tracking', desc: 'Never miss a doctor visit. Smart reminders and post-visit notes for everyone to see.' },
              { icon: AlertTriangle, color: 'danger', title: 'Emergency SOS', desc: 'One large button for the elderly person. Instant alerts to family and caregiver.' },
              { icon: Clock, color: 'accent', title: 'Shared Timeline', desc: 'A single chronological feed of all care events — medicines, visits, notes, and alerts.' },
              { icon: Users, color: 'secondary', title: 'Caregiver Directory', desc: 'Browse and connect with verified local caregivers. Build your Care Circle.' },
              { icon: Phone, color: 'primary', title: 'Care Circle', desc: 'Invite family members and caregivers. Everyone stays in the loop, always.' },
            ].map((item) => (
              <div key={item.title} className="card p-5 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl bg-${item.color}-100 text-${item.color}-600 flex items-center justify-center mb-4`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-neutral-800">{item.title}</h3>
                <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-800">
          Ready to see it in action?
        </h2>
        <p className="text-neutral-500 mt-3 max-w-lg mx-auto">
          Choose a role and explore the full demo. No sign-up needed — it's a prototype for a
          college project review.
        </p>
        <button
          onClick={onEnter}
          className="mt-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 mx-auto"
        >
          Choose Your Role
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-lg text-neutral-700">CareBridge</span>
          </div>
          <Disclaimer />
          <p className="text-center text-xs text-neutral-400 mt-2">
            Academic Final-Year Engineering Project · Prototype Demo · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
