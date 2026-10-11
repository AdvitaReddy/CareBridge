import { Heart, Pill, Calendar, AlertTriangle, Users, ArrowRight, ShieldCheck, Clock, Phone } from 'lucide-react';
import Disclaimer from '@/components/Disclaimer';
import Bridgey from '@/components/Bridgey';

interface LandingProps {
  onEnter: () => void;
}

export default function Landing({ onEnter }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 via-primary-50 to-tertiary-50 dark:from-bg-dark dark:via-bg-dark dark:to-surface-dark">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-text flex items-center justify-center shadow-md">
            <Heart className="w-6 h-6" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl text-neutral-800">CareBridge</span>
        </div>
        <a
          href="#how-it-helps"
          className="btn-outline px-5 py-2.5 text-sm flex items-center gap-2"
        >
          How it helps
          <ArrowRight className="w-4 h-4" />
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-8 sm:pt-16 pb-12 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6 animate-fade-in">
          <ShieldCheck className="w-4 h-4" />
          Coordinated care for the whole family
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-neutral-800 leading-tight max-w-3xl mx-auto animate-slide-up">
          Caring for the people you love,
          <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"> even from afar.</span>
        </h1>
        <p className="text-base sm:text-lg text-neutral-500 mt-6 max-w-2xl mx-auto leading-relaxed animate-slide-up">
          When someone you love needs support from afar, the details can quickly become difficult to
          keep track of. CareBridge brings medicines, appointments, caregivers, and emergencies into
          one shared platform — so no dose is missed and no call is forgotten.
        </p>
        <div className="bridgey-landing-intro animate-slide-up" aria-label="Bridgey welcome">
          <Bridgey expression="happy" size="md" floating={false} interactive={false} showTips={false} />
          <div className="bridgey-landing-intro__bubble">
            <span>Meet Bridgey</span>
            <p>A little care, shared well, goes a long way.</p>
          </div>
        </div>
        <button
          onClick={onEnter}
          className="btn-secondary mt-8 px-8 py-4 text-base sm:text-lg flex items-center gap-2 mx-auto animate-slide-up"
        >
          Sign in
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Problem */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-12">
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
      <section id="how-it-helps" className="bg-surface-light dark:bg-surface-dark py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
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

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-text flex items-center justify-center">
              <Heart className="w-5 h-5" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-lg text-neutral-700">CareBridge</span>
          </div>
          <Disclaimer />
          <p className="text-center text-xs text-neutral-400 mt-2">
            Care coordination for the people who matter most · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
