import { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { STUDY_SLUG } from '@/studies/telehealth-readiness/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, AlertCircle } from 'lucide-react';

type AdminRegisterFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function AdminRegisterForm({ onSuccess, onCancel }: AdminRegisterFormProps) {
  const { refresh } = useAdmin();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingMessage('');
    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          studySlug: STUDY_SLUG,
        }),
      });
      if (!res.ok) throw new Error('register failed');
      const user = (await res.json()) as { status: string };
      if (user.status === 'pending') {
        setPendingMessage('Registration submitted. An admin will approve your account before you can sign in.');
        return;
      }
      const me = await refresh();
      if (!me) {
        setError('Account created, but sign-in failed. Try logging in.');
        return;
      }
      onSuccess?.();
    } catch {
      setError('Could not create account. This email may already be registered.');
    } finally {
      setSubmitting(false);
    }
  };

  if (pendingMessage) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{pendingMessage}</p>
        {onCancel && (
          <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
            Back to sign in
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-register-name">Full name</Label>
        <Input
          id="admin-register-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-register-email">Email</Label>
        <Input
          id="admin-register-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-register-password">Password</Label>
        <Input
          id="admin-register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      <Button type="submit" className="w-full gap-2" disabled={submitting}>
        <UserPlus className="w-4 h-4" />
        {submitting ? 'Creating account...' : 'Create account'}
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Back to sign in
        </Button>
      )}
    </form>
  );
}
