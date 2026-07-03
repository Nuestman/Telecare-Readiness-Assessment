import { Route, Redirect } from 'wouter';
import { ProtectedStudyAdminRoute } from '@/components/auth/ProtectedStudyAdminRoute';
import AdminLoginPage from '@/studies/telehealth-readiness/pages/AdminLoginPage';
import AdminRegisterPage from '@/studies/telehealth-readiness/pages/AdminRegisterPage';
import AdminUsersPage from '@/studies/telehealth-readiness/pages/AdminUsersPage';
import LandingPage from '@/studies/telehealth-readiness/pages/LandingPage';
import SurveyPage from '@/studies/telehealth-readiness/pages/SurveyPage';
import AdminDashboard from '@/studies/telehealth-readiness/pages/AdminDashboard';
import AdminReportPage from '@/studies/telehealth-readiness/pages/AdminReportPage';
import SurveyDetail from '@/studies/telehealth-readiness/pages/SurveyDetail';
import { studyPaths, STUDY_SLUG } from '@/studies/telehealth-readiness/paths';

/** Route elements for the hub Switch — must be a Fragment, not a nested Switch. */
export const telehealthStudyRouteElements = (
  <>
    <Route path={studyPaths.landing} component={LandingPage} />
    <Route path={studyPaths.survey} component={SurveyPage} />
    <Route path={studyPaths.adminLogin} component={AdminLoginPage} />
    <Route path="/studies/telehealth-readiness/admin/register">
      <Redirect to={studyPaths.registration} />
    </Route>
    <Route path={studyPaths.registration} component={AdminRegisterPage} />
    <Route path={studyPaths.adminUsers}>
      {() => (
        <ProtectedStudyAdminRoute
          studySlug={STUDY_SLUG}
          studyPaths={studyPaths}
          component={AdminUsersPage}
          minRole="admin"
        />
      )}
    </Route>
    <Route path={studyPaths.adminReport}>
      {() => (
        <ProtectedStudyAdminRoute
          studySlug={STUDY_SLUG}
          studyPaths={studyPaths}
          component={AdminReportPage}
        />
      )}
    </Route>
    <Route path={studyPaths.admin}>
      {() => (
        <ProtectedStudyAdminRoute
          studySlug={STUDY_SLUG}
          studyPaths={studyPaths}
          component={AdminDashboard}
        />
      )}
    </Route>
    <Route path="/studies/telehealth-readiness/admin/responses/:id">
      {() => (
        <ProtectedStudyAdminRoute
          studySlug={STUDY_SLUG}
          studyPaths={studyPaths}
          component={SurveyDetail}
        />
      )}
    </Route>
  </>
);
