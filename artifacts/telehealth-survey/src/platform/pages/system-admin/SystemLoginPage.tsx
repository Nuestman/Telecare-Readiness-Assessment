import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useSystemAdmin } from '@/platform/context/SystemAdminContext';
import { systemAdminPaths, platformPaths } from '@/platform/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SystemLoginPage() {
  const { login } = useSystemAdmin();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setLocation(systemAdminPaths.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Platform administration</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in for system-level study management.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sys-email">Email</Label>
              <Input
                id="sys-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sys-password">Password</Label>
              <Input
                id="sys-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            <Link href={platformPaths.landing} className="hover:underline">
              Back to research platform
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
