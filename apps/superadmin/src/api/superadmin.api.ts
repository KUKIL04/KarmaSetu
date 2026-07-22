// apps/superadmin/src/api/superadmin.api.ts
import { adminApiClient } from './client';

export const SuperAdminAPI = {

  // Platform Analytics
  getPlatformStats: async () => {
    const response = await adminApiClient.get('/platform/stats');
    return response.data;
  },

  // Tenant Management
  listTenants: async () => {
    const response = await adminApiClient.get('/platform/tenants');
    return response.data;
  },

  getTenant: async (tenantId: string) => {
    const response = await adminApiClient.get(`/platform/tenants/${tenantId}`);
    return response.data;
  },

  updateTenantStatus: async (tenantId: string, status: 'ACTIVE' | 'FROZEN') => {
    const response = await adminApiClient.put(`/platform/tenants/${tenantId}/status`, { status });
    return response.data;
  },

  // Global User Management (To be implemented on backend)
  listGlobalUsers: async () => {
    const response = await adminApiClient.get('/platform/users');
    return response.data;
  },
  
  blacklistUser: async (userId: string, isBlacklisted: boolean) => {
    const response = await adminApiClient.put(`/platform/users/${userId}/blacklist`, { isBlacklisted });
    return response.data;
  },

  // Audit Ledger
  getAuditLogs: async () => {
    const response = await adminApiClient.get('/platform/audits');
    return response.data;
  },

  getSystemTelemetry: async () => {
    const response = await adminApiClient.get('/platform/telemetry');
    return response.data;
  },

  flushTelemetry: async () => {
    const response = await adminApiClient.post('/platform/telemetry/flush');
    return response.data;
  }
};