import { Role } from "../../../core/models/auth.types";

export interface DashboardNavigationItem {
  label: string;
  route: string[];
  requiredRoles?: Role[];
  icon?: string;
}
