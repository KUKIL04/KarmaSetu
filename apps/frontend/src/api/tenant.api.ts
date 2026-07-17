import { apiClient } from './client';

export const TenantAPI = {
  registerTenant: async (tenantData: any) => {
    const response = await apiClient.post('/tenant/register', tenantData);
    return response.data; // Returns { message, tenant, admin }
  }
};