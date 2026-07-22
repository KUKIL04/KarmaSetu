-- Remove the NOT NULL constraint from the tenant_id column
ALTER TABLE refresh_tokens 
ALTER COLUMN tenant_id DROP NOT NULL;