import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AdminProvider } from '@/context/AdminContext';
import { SystemAdminProvider, useSystemAdmin } from '@/platform/context/SystemAdminContext';
import PlatformLandingPage from '@/platform/pages/PlatformLandingPage';
import SystemLoginPage from '@/platform/pages/system-admin/SystemLoginPage';
import SystemDashboardPage from '@/platform/pages/system-admin/SystemDashboardPage';
import SystemHealthPage from '@/platform/pages/system-admin/SystemHealthPage';
import StudiesListPage from '@/platform/pages/system-admin/StudiesListPage';
import StudyEditPage from '@/platform/pages/system-admin/StudyEditPage';
import StudyAccessPage from '@/platform/pages/system-admin/StudyAccessPage';
import SystemUsersPage from '@/platform/pages/system-admin/SystemUsersPage';
import { systemAdminPaths, platformPaths } from '@/platform/paths';
import { telehealthStudyRouteElements } from '@/studies/telehealth-readiness/study-routes';
import { clinicianStudyRouteElements } from '@/studies/clinician-telehealth-readiness/study-routes';
import { studyPaths as telehealthStudyPaths } from '@/studies/telehealth-readiness/paths';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';

const queryClient = new QueryClient();

function ProtectedSystemRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useSystemAdmin();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to={systemAdminPaths.login} />;
  return <Component />;
}

function HubRouter() {
  return (
    <Switch>
      <Route path={platformPaths.landing} component={PlatformLandingPage} />
      <Route path={platformPaths.studies}><Redirect to={platformPaths.landing} /></Route>

      <Route path={systemAdminPaths.login} component={SystemLoginPage} />
      <Route path={systemAdminPaths.dashboard}>
        {() => <ProtectedSystemRoute component={SystemDashboardPage} />}
      </Route>
      <Route path={systemAdminPaths.health}>
        {() => <ProtectedSystemRoute component={SystemHealthPage} />}
      </Route>
      <Route path={systemAdminPaths.studies}>
        {() => <ProtectedSystemRoute component={StudiesListPage} />}
      </Route>
      <Route path="/system/admin/studies/:slug/access">
        {() => <ProtectedSystemRoute component={StudyAccessPage} />}
      </Route>
      <Route path="/system/admin/studies/:slug">
        {() => <ProtectedSystemRoute component={StudyEditPage} />}
      </Route>
      <Route path={systemAdminPaths.users}>
        {() => <ProtectedSystemRoute component={SystemUsersPage} />}
      </Route>

      {/* Legacy telehealth URLs (pre multi-study paths) */}
      <Route path="/survey"><Redirect to={telehealthStudyPaths.survey} /></Route>
      <Route path="/registration"><Redirect to={telehealthStudyPaths.registration} /></Route>
      <Route path="/admin/register"><Redirect to={telehealthStudyPaths.registration} /></Route>
      <Route path="/admin/login"><Redirect to={telehealthStudyPaths.adminLogin} /></Route>
      <Route path="/admin/report"><Redirect to={telehealthStudyPaths.adminReport} /></Route>
      <Route path="/admin/users"><Redirect to={telehealthStudyPaths.adminUsers} /></Route>
      <Route path="/admin/survey/:id">
        {(params) => <Redirect to={telehealthStudyPaths.adminResponse(params.id)} />}
      </Route>
      <Route path="/admin"><Redirect to={telehealthStudyPaths.admin} /></Route>

      {telehealthStudyRouteElements}
      {clinicianStudyRouteElements}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SystemAdminProvider>
        <AdminProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <HubRouter />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AdminProvider>
      </SystemAdminProvider>
    </QueryClientProvider>
  );
}

export default App;
