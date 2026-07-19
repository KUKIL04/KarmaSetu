import { apiClient } from './client';

export const AdminAPI = {
  // Generate a secure invite link for a new employee
  inviteUser: async (email: string, expireHours: number = 24) => {
    const response = await apiClient.post('/admin/invite', { email, expireHours });
    return response.data; // Returns { success, inviteLink, expiresAt }
  },

  // Register a new module/app for the tenant workspace
  registerModule: async (name: string, description: string) => {
    const response = await apiClient.post('/admin/modules', { name, description });
    return response.data; // Returns { success, module }
  },

  // Unlock a user from the Waiting Room and assign them modules
  grantAccess: async (targetUserId: string, moduleIds: string[], roleIds: string[] = []) => {
    const response = await apiClient.post('/admin/grant-access', { targetUserId, moduleIds, roleIds });
    return response.data; // Returns { success, message }
  },

  getModules: async () => {
    const response = await apiClient.get('/admin/modules');
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  updateUserStatus: async (userId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    const response = await apiClient.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  getAuditLogs: async () => {
    const response = await apiClient.get('/admin/audits');
    return response.data;
  },

  getRoles: async () => {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  },

  getPermissions: async () => {
    const response = await apiClient.get('/admin/permissions');
    return response.data;
  },

  createRole: async (name: string, description: string) => {
    const response = await apiClient.post('/admin/roles', { name, description });
    return response.data;
  },

  // Fetch all users who have access to a specific module
  getModuleUsers: async (moduleId: string) => {
    const response = await apiClient.get(`/admin/modules/${moduleId}/users`);
    return response.data;
  },
  
  // Revoke a specific user's access to a specific module
  revokeModuleAccess: async (userId: string, moduleId: string) => {
    const response = await apiClient.delete(`/admin/users/${userId}/modules/${moduleId}`);
    return response.data;
  },

  // Add to AdminAPI object
  getActiveSessions: async () => {
    const response = await apiClient.get('/admin/sessions');
    return response.data;
  },
  
  revokeSession: async (tokenId: string) => {
    const response = await apiClient.delete(`/admin/sessions/${tokenId}`);
    return response.data;
  },

  triggerPasswordReset: async (userId: string) => {
    const response = await apiClient.post(`/admin/users/${userId}/reset-password`);
    return response.data;
  },

  clearSecurityLockout: async (userId: string) => {
    const response = await apiClient.post(`/admin/users/${userId}/clear-lockout`);
    return response.data;
  },

  getSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (data: { name: string; customDomain: string; logoUrl: string; themeColor: string }) => {
    const response = await apiClient.put('/admin/settings', data);
    return response.data;
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file); // 'logo' matches our multer uploadLogo.single('logo') configuration

    const response = await apiClient.post('/admin/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Override JSON for file uploads
      },
    });
    return response.data; // Returns { success, logoUrl }
  },

  // -- Module Access Map --
  grantBulkModuleAccess: async (moduleId: string, userIds: string[], accessLevel: 'READ' | 'WRITE' = 'READ') => {
    const response = await apiClient.post('/admin/modules/bulk-grant', { moduleId, userIds, accessLevel });
    return response.data;
  },
  
  updateModuleAccessLevel: async (moduleId: string, userId: string, accessLevel: 'READ' | 'WRITE') => {
    const response = await apiClient.put(`/admin/modules/${moduleId}/users/${userId}/access`, { accessLevel });
    return response.data;
  },

  // -- Role Assignments --
  getRoleUsers: async (roleId: string) => {
    const response = await apiClient.get(`/admin/roles/${roleId}/users`);
    return response.data;
  },

  grantBulkRoleAccess: async (roleId: string, userIds: string[]) => {
    const response = await apiClient.post('/admin/roles/bulk-grant', { roleId, userIds });
    return response.data;
  },

  revokeRoleAccess: async (userId: string, roleId: string) => {
    const response = await apiClient.delete(`/admin/users/${userId}/roles/${roleId}`);
    return response.data;
  },
};