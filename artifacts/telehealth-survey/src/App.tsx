import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AdminProvider, useAdmin } from '@/context/AdminContext';
import NotFound from '@/pages/not-found';
import AdminLoginPage from '@/studies/telehealth-readiness/pages/AdminLoginPage';
import AdminRegisterPage from '@/studies/telehealth-readiness/pages/AdminRegisterPage';
import LandingPage from '@/studies/telehealth-readiness/pages/LandingPage';
import SurveyPage from '@/studies/telehealth-readiness/pages/SurveyPage';
import AdminDashboard from '@/studies/telehealth-readiness/pages/AdminDashboard';
import AdminReportPage from '@/studies/telehealth-readiness/pages/AdminReportPage';
import SurveyDetail from '@/studies/telehealth-readiness/pages/SurveyDetail';
import { studyPaths } from '@/studies/telehealth-readiness/paths';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';

const queryClient = new QueryClient();

function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAdmin();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to={studyPaths.adminLogin} />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={studyPaths.landing} component={LandingPage} />
      <Route path={studyPaths.survey} component={SurveyPage} />
      <Route path={studyPaths.adminLogin} component={AdminLoginPage} />
      <Route path={studyPaths.adminRegister} component={AdminRegisterPage} />
      <Route path={studyPaths.adminReport}>
        {() => <ProtectedAdminRoute component={AdminReportPage} />}
      </Route>
      <Route path={studyPaths.admin}>
        {() => <ProtectedAdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/studies/telehealth-readiness/admin/responses/:id">
        {() => <ProtectedAdminRoute component={SurveyDetail} />}
      </Route>

      <Route path="/"><Redirect to={studyPaths.landing} /></Route>
      <Route path="/survey"><Redirect to={studyPaths.survey} /></Route>
      <Route path="/admin/login"><Redirect to={studyPaths.adminLogin} /></Route>
      <Route path="/admin/register"><Redirect to={studyPaths.adminRegister} /></Route>
      <Route path="/admin/report"><Redirect to={studyPaths.adminReport} /></Route>
      <Route path="/admin"><Redirect to={studyPaths.admin} /></Route>
      <Route path="/admin/survey/:id">
        {(params) => <Redirect to={studyPaths.adminResponse(params.id)} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AdminProvider>
    </QueryClientProvider>
  );
}

export default App;
