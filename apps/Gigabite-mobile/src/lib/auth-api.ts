import { apiGet, apiPost } from './api-client';

export type MobileAuthUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  defaultDeliveryAddress: string | null;
  workLocation: string | null;
  role: 'user' | 'staff' | 'manager';
};

export type MobileLoginResponse = {
  token: string;
  user: MobileAuthUser;
};

export async function loginMobileUser(input: { email: string; password: string }) {
  return apiPost<MobileLoginResponse>('/api/mobile/auth/login', input, { skipAuth: true });
}

export async function getMobileAuthUser(token: string) {
  return apiGet<{ user: MobileAuthUser | null }>('/api/mobile/auth/me', { token });
}
