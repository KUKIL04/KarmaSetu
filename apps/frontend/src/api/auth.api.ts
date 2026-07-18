import { publicClient } from './client';

export const AuthAPI = {
  login: async (email: string, password: string, tenantId: string) => {
    const response = await publicClient.post('/auth/login', { email, password, tenantId });
    return response.data;
  },

  register: async (registrationData: any) => {
    const response = await publicClient.post('/auth/register', registrationData);
    return response.data;
  },

  sendOtp: async (target: string, type: 'EMAIL' | 'PHONE') => {
    const response = await publicClient.post('/otp/send', { target, type });
    return response.data;
  },

  verifyOtp: async (target: string, type: 'EMAIL' | 'PHONE', otp: string) => {
    const response = await publicClient.post('/otp/verify', { target, type, otp });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    // This will trigger the Redis OTP for the 'EMAIL' type on the backend
    const response = await publicClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    // This endpoint will verify the OTP and update the user's password hash in Postgres
    const response = await publicClient.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },

  verifyInvite: async (token: string) => {
    const response = await publicClient.get(`/auth/invite/${token}`);
    return response.data; // Returns { email }
  },

  logout: async (refreshToken: string) => {
    // publicClient ensures this doesn't trigger 401 interceptors during the logout process
    const response = await publicClient.post('/auth/logout', { refreshToken });
    return response.data;
  },
};