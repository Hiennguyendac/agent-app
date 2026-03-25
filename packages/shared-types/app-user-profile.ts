import type { AppUserRole } from "./app-user-role";

export interface AppUserProfile {
  id: string;
  username: string;
  displayName?: string;
  role: AppUserRole;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  isActive: boolean;
}
