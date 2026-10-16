import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Heart, Mail, UserRound } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import PasswordInput from '@/components/PasswordInput';
import useFormFeedback from '@/hooks/useFormFeedback';
import FormFeedbackMessage from '@/components/FormFeedbackMessage';

interface SignUpProps {
  onBack: () => void;
  onLogin: () => void;
}

export default function SignUp({ onBack, onLogin }: SignUpProps) {
  const { signUp } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const { isSaving, success, error, clear, run } = useFormFeedback();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let needsConfirmation = false;
    const saved = await run(async () => {
      needsConfirmation = await signUp(email, password, fullName);
      setConfirmationRequired(needsConfirmation);
    }, 'Account created');
    if (saved) {
      setEmail('');
      setPassword('');
      setFullName('');
      if (!needsConfirmation) onLogin();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-100 via-primary-50 to-tertiary-50 dark:from-bg-dark dark:via-bg-dark dark:to-surface-dark">
      <nav className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-text flex items-center justify-center shadow-md">
            <Heart className="w-6 h-6" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl text-neutral-800">CareBridge</span>
        </div>
        <button onClick={onBack} className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-100 transition-colors flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </nav>
      <section className="max-w-md mx-auto px-6 py-10 sm:py-16">
        <div className="card p-7 sm:p-9">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center mb-5">
            <Heart className="w-6 h-6" fill="currentColor" />
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-neutral-800">Create your account</h1>
          <p className="text-neutral-500 mt-2 mb-7">Use the email address that received your Care Circle invitation.</p>
          {confirmationRequired ? (
            <div role="status" className="space-y-4">
              <p className="inline-flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                Account created. Check your email to confirm your address, then sign in to respond to the invitation.
              </p>
              <button type="button" onClick={onLogin} className="btn-primary w-full justify-center">Go to sign in</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm font-semibold text-neutral-700">
                Full name
                <span className="relative mt-2 block">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input type="text" autoComplete="name" required value={fullName} onChange={(event) => { clear(); setFullName(event.target.value); }} className="w-full rounded-xl border px-10 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-primary-400" placeholder="Your full name" />
                </span>
              </label>
              <label className="block text-sm font-semibold text-neutral-700">
                Email address
                <span className="relative mt-2 block">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input type="email" autoComplete="email" required value={email} onChange={(event) => { clear(); setEmail(event.target.value); }} className="w-full rounded-xl border px-10 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-primary-400" placeholder="you@example.com" />
                </span>
              </label>
              <label className="block text-sm font-semibold text-neutral-700">
                Password
                <PasswordInput
                  autoComplete="new-password"
                  minLength={6}
                  value={password}
                  onChange={(value) => { clear(); setPassword(value); }}
                  placeholder="At least 6 characters"
                />
              </label>
              <FormFeedbackMessage success={success} error={error} />
              <button type="submit" disabled={isSaving} className="btn-secondary w-full justify-center flex items-center gap-2 disabled:cursor-wait disabled:opacity-60">
                {isSaving ? 'Saving...' : 'Sign up'}
                {!isSaving && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
