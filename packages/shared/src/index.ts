export type UserStatus = 'PENDING' | 'ACTIVE';

export interface TenantBranding {
  companyName: string;
  logoUrl: string | null;
  themeColor: string;
}