export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNotifications {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  pushToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}