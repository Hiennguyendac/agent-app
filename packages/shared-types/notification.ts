export interface Notification {
  id: string;
  message: string;
  recipientDepartmentId?: string;
  recipientUserId?: string;
  assignmentId?: string;
  workItemId?: string;
  createdAt: string;
  isRead: boolean;
}
