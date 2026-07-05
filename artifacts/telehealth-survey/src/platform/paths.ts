export const platformPaths = {
  landing: '/',
  studies: '/studies',
} as const;

export const systemAdminPaths = {
  login: '/system/admin/login',
  dashboard: '/system/admin',
  health: '/system/admin/health',
  studies: '/system/admin/studies',
  studyEdit: (slug: string) => `/system/admin/studies/${slug}`,
  studyAccess: (slug: string) => `/system/admin/studies/${slug}/access`,
  users: '/system/admin/users',
  prospectus: '/system/admin/prospectus',
  prospectusDetail: (id: number | string) => `/system/admin/prospectus/${id}`,
} as const;

export { prospectusPaths, systemProspectusPaths } from './paths-prospectus';
