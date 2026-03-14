import { dashboardMenusByRole } from '../config/dashboardMenus';

export function useDashboardMenu(role) {
  return dashboardMenusByRole[role] ?? dashboardMenusByRole.admin;
}
