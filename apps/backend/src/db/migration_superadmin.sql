-- ==========================================
-- MIGRATION SCRIPT: SuperAdmin Control Plane
-- ==========================================

-- 1. UPGRADE TENANTS TABLE (The Kill Switch)
-- Create the enum for tenant states if it doesn't exist
DO $$ BEGIN
    CREATE TYPE tenant_status AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'FROZEN', 'DELETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the status column to the tenants table with a default of ACTIVE
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS status tenant_status DEFAULT 'ACTIVE' NOT NULL;


-- 2. UPGRADE USERS TABLE (Global Platform Access & Banning)
-- Add flags to identify platform owners and block bad actors globally
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE NOT NULL;


-- 3. METERING & BILLING ENGINE
-- Tracks the commercial relationship and current usage limits
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Billing Tier Information
  plan_tier VARCHAR(50) DEFAULT 'FREE_TIER' NOT NULL, 
  
  -- The current billing window
  current_cycle_start TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_cycle_end TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 month'),
  
  -- Live Metering Counters
  mau_count INT DEFAULT 0 NOT NULL,         
  api_request_count BIGINT DEFAULT 0 NOT NULL, 
  
  -- Configurable Quotas (Null means unlimited)
  max_mau INT DEFAULT 100, 
  max_api_requests BIGINT DEFAULT 10000,
  
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE(tenant_id)
);


-- 4. PLATFORM THREAT INTELLIGENCE
-- Global firewall for blocking malicious botnets, scrapers, or bad IPs
CREATE TABLE IF NOT EXISTS platform_ip_bans (
  ip_address VARCHAR(45) PRIMARY KEY, 
  reason TEXT NOT NULL,               
  banned_by UUID REFERENCES users(id) ON DELETE SET NULL, 
  expires_at TIMESTAMPTZ,             -- Null means a permanent ban
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- 5. CONTROL PLANE AUDIT LEDGER
-- Immutable ledger for tracking SuperAdmin actions
CREATE TABLE IF NOT EXISTS superadmin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL, 
  target_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, 
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,     
  
  action VARCHAR(100) NOT NULL, -- e.g., 'TENANT_FROZEN', 'USER_BLACKLISTED'
  ip_address VARCHAR(45),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. INDEXES FOR PERFORMANCE
-- Fast lookups for authorization and firewall checks
CREATE INDEX IF NOT EXISTS idx_users_superadmin ON users(is_superadmin) WHERE is_superadmin = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_blacklisted ON users(is_blacklisted) WHERE is_blacklisted = TRUE;
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);