-- ==========================================
-- MIGRATION SCRIPT: Global Identity (Idempotent Recovery)
-- ==========================================

BEGIN;

-- STEP 1: Ensure workspace_memberships exists
CREATE TABLE IF NOT EXISTS workspace_memberships (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status user_status DEFAULT 'UNVERIFIED' NOT NULL,
  is_tenant_admin BOOLEAN DEFAULT FALSE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, tenant_id)
);

-- STEP 2: Populate workspace_memberships ONLY IF users.tenant_id still exists
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='tenant_id'
  ) THEN
    INSERT INTO workspace_memberships (user_id, tenant_id, status, is_tenant_admin, joined_at)
    SELECT id, tenant_id, status, is_tenant_admin, created_at
    FROM users
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
  END IF;
END $$;

-- STEP 3: Deduplicate duplicate emails in users
-- 3a. Re-link workspace_memberships to the oldest user_id per email
WITH user_mappings AS (
  SELECT id AS old_user_id,
         FIRST_VALUE(id) OVER (PARTITION BY LOWER(email) ORDER BY created_at ASC) AS master_user_id
  FROM users
)
INSERT INTO workspace_memberships (user_id, tenant_id, status, is_tenant_admin, joined_at)
SELECT m.master_user_id, wm.tenant_id, wm.status, wm.is_tenant_admin, wm.joined_at
FROM workspace_memberships wm
JOIN user_mappings m ON wm.user_id = m.old_user_id
WHERE m.old_user_id <> m.master_user_id
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- 3b. Re-link user_roles
WITH user_mappings AS (
  SELECT id AS old_user_id,
         FIRST_VALUE(id) OVER (PARTITION BY LOWER(email) ORDER BY created_at ASC) AS master_user_id
  FROM users
)
UPDATE user_roles ur
SET user_id = m.master_user_id
FROM user_mappings m
WHERE ur.user_id = m.old_user_id AND m.old_user_id <> m.master_user_id;

-- 3c. Re-link user_modules
WITH user_mappings AS (
  SELECT id AS old_user_id,
         FIRST_VALUE(id) OVER (PARTITION BY LOWER(email) ORDER BY created_at ASC) AS master_user_id
  FROM users
)
UPDATE user_modules um
SET user_id = m.master_user_id
FROM user_mappings m
WHERE um.user_id = m.old_user_id AND m.old_user_id <> m.master_user_id;

-- 3d. Re-link refresh_tokens
WITH user_mappings AS (
  SELECT id AS old_user_id,
         FIRST_VALUE(id) OVER (PARTITION BY LOWER(email) ORDER BY created_at ASC) AS master_user_id
  FROM users
)
UPDATE refresh_tokens rt
SET user_id = m.master_user_id
FROM user_mappings m
WHERE rt.user_id = m.old_user_id AND m.old_user_id <> m.master_user_id;

-- 3e. Remove duplicate user records, keeping only the oldest record per email
DELETE FROM users
WHERE id NOT IN (
  SELECT FIRST_VALUE(id) OVER (PARTITION BY LOWER(email) ORDER BY created_at ASC)
  FROM users
);

-- STEP 4: Handle duplicate mobile numbers (append suffix if duplicates exist across different emails)
UPDATE users u
SET mobile_no = u.mobile_no || '_' || SUBSTRING(u.id::text, 1, 4)
WHERE u.id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY mobile_no ORDER BY created_at ASC) as rn
    FROM users
  ) t WHERE t.rn > 1
);

-- STEP 5: Drop legacy constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tenant_id_email_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tenant_id_mobile_no_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;

-- STEP 6: Safely drop legacy tenant columns if they still exist
ALTER TABLE users 
  DROP COLUMN IF EXISTS tenant_id,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS is_tenant_admin;

-- STEP 7: Add Global Unique Constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mobile_no_unique;
ALTER TABLE users ADD CONSTRAINT users_mobile_no_unique UNIQUE (mobile_no);

COMMIT;