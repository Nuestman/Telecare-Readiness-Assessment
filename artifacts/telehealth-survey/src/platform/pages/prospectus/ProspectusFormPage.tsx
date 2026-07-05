import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { PlatformFooter } from '@/platform/components/PlatformFooter';
import { createProspectus } from '@/platform/lib/prospectus-api';
import { prospectusPaths } from '@/platform/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProspectusFormPage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await createProspectus({
        submitterName: name,
        submitterEmail: email,
        title: title || undefined,
      });
      navigate(prospectusPaths.status(result.publicId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create prospectus');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-xl mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold">Start research prospectus</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step 1 of 10 — save your tracking link after starting.
          </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <Label htmlFor="prospectus-name">Your name</Label>
            <Input
              id="prospectus-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="prospectus-email">Email</Label>
            <Input
              id="prospectus-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="prospectus-title">Working title (optional)</Label>
            <Input
              id="prospectus-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create draft'}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href={prospectusPaths.landing}>Cancel</Link>
            </Button>
          </div>
        </form>
      </main>

      <div className="max-w-xl mx-auto px-4">
        <PlatformFooter />
      </div>
    </div>
  );
}
