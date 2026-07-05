export const prospectusPaths = {
  landing: '/research/prospectus',
  new: '/research/prospectus/new',
  status: (publicId: string) => `/research/prospectus/${publicId}`,
} as const;

export const systemProspectusPaths = {
  queue: '/system/admin/prospectus',
  detail: (id: number | string) => `/system/admin/prospectus/${id}`,
} as const;
