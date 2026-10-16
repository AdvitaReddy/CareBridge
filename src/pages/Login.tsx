import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Heart, Mail } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import PasswordInput from '@/components/PasswordInput';

interface LoginProps {
  onBack: () => void;
  onSignUp: () => void;
}

export default function Login({ onBack, onSignUp }: LoginProps) {
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
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
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </nav>

      <section className="max-w-md mx-auto px-6 py-10 sm:py-16">
        <div className="card p-7 sm:p-9">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center mb-5">
            <Heart className="w-6 h-6" fill="currentColor" />
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-neutral-800">Welcome back</h1>
          <p className="text-neutral-500 mt-2 mb-7">Sign in to your CareBridge account.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-semibold text-neutral-700">
              Email address
              <span className="relative mt-2 block">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border px-10 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="you@example.com"
                />
              </span>
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              Password
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
              />
            </label>

            {error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-secondary w-full justify-center flex items-center gap-2 disabled:cursor-wait disabled:opacity-60">
              {submitting ? 'Signing in...' : 'Sign in'}
              {!submitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-neutral-500">
            New to CareBridge?{' '}
            <button type="button" onClick={onSignUp} className="font-semibold text-primary-700 hover:underline">
              Create an account
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}