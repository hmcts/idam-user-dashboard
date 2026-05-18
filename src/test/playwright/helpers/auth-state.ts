import path from 'path';

export function getProjectKey(projectName: string): string {
  return projectName.replace(/^setup-/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

export function getAdminEmailForProject(projectName: string): string {
  return process.env.TEST_ADMIN_EMAIL || `test${getProjectKey(projectName).replace(/-/g, '')}@admin.local`;
}

export function getStorageStatePath(projectName: string): string {
  return path.resolve(process.cwd(), 'test-results', '.auth', `${getProjectKey(projectName)}.json`);
}
