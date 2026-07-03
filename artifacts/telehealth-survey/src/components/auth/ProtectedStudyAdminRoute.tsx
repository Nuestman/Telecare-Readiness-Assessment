import { Redirect } from 'wouter';
import { Link } from 'wouter';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  hasMinStudyRole,
  roleRequirementMessage,
  type StudyRole,
} from '@/lib/study-roles';

type StudyAdminPaths = {
  admin: string;
  adminLogin: string;
};

export function ProtectedStudyAdminRoute({
  studySlug,
  studyPaths,
  component: Component,
  minRole = 'viewer',
}: {
  studySlug: string;
  studyPaths: StudyAdminPaths;
  component: React.ComponentType;
  minRole?: StudyRole;
}) {
  const { isAuthenticated, isLoading, hasStudyAccess, getStudyRole } = useAdmin();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to={studyPaths.adminLogin} />;

  if (!hasStudyAccess(studySlug)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No study access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account is signed in but does not have access to this study. Contact your
              platform administrator or study lead.
            </p>
            <Button asChild variant="outline">
              <Link href={studyPaths.adminLogin}>Back to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const role = getStudyRole(studySlug);
  if (!hasMinStudyRole(role, minRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Insufficient access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {roleRequirementMessage(minRole, role)}
            </p>
            <p className="text-sm text-muted-foreground">
              Ask a study administrator to upgrade your role if you need access to this area.
            </p>
            <Button asChild variant="outline">
              <Link href={studyPaths.admin}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Component />;
}
