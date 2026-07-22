import { pool } from '../db/index.js';

export class QueryService {
  // --- Tenants ---
  static async createTenant(data: {
    companyName: string; domain?: string; logoUrl?: string; themeColor?: string;
    legalName?: string; taxId?: string; registrationNumber?: string;
    industry?: string; orgSize?: string;
    addressStreet?: string; addressCity?: string; addressState?: string; addressPincode?: string;
  }) {
    const query = `
      INSERT INTO tenants (
        company_name, custom_domain, logo_url, theme_color,
        legal_name, tax_id, registration_number, industry, org_size,
        address_street, address_city, address_state, address_pincode
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const values = [
      data.companyName, data.domain || null, data.logoUrl || null, data.themeColor || '#000000',
      data.legalName || null, data.taxId || null, data.registrationNumber || null,
      data.industry || null, data.orgSize || null,
      data.addressStreet || null, data.addressCity || null, data.addressState || null, data.addressPincode || null
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async getTenantById(tenantId: string) {
    const res = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    return res.rows[0];
  }

  // FIXED: Joined workspace_memberships to get status and tenant mapping
  static async getTenantsByEmail(email: string) {
    const query = `
      SELECT u.id as user_id, u.password_hash, wm.status, wm.is_tenant_admin, u.first_name, u.last_name, u.email,
             t.id as tenant_id, t.company_name, t.logo_url, t.status as tenant_status
      FROM users u
      JOIN workspace_memberships wm ON u.id = wm.user_id
      JOIN tenants t ON wm.tenant_id = t.id
      WHERE u.email = $1;
    `;
    const res = await pool.query(query, [email]);
    return res.rows;
  }

  static async getTenantsByUserId(userId: string) {
    const query = `
      SELECT t.id as tenant_id, t.company_name, t.logo_url, wm.status, t.status as tenant_status
      FROM workspace_memberships wm
      JOIN tenants t ON wm.tenant_id = t.id
      WHERE wm.user_id = $1;
    `;
    const res = await pool.query(query, [userId]);
    return res.rows;
  }

  static async getTenantAdmins(tenantId: string) {
    const query = `
      SELECT u.email, u.first_name, u.last_name
      FROM users u
      JOIN workspace_memberships wm ON u.id = wm.user_id
      WHERE wm.tenant_id = $1 AND wm.is_tenant_admin = true;
    `;
    const res = await pool.query(query, [tenantId]);
    return res.rows;
  }

  static async updateTenantBranding(tenantId: string, companyName: string, logoUrl: string | null, themeColor: string) {
    const query = `
      UPDATE tenants 
      SET company_name = $2, logo_url = $3, theme_color = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const res = await pool.query(query, [tenantId, companyName, logoUrl, themeColor]);
    return res.rows[0];
  }

  // --- Users ---
  // FIXED: Converted to a Transaction to insert into both users AND workspace_memberships
  static async createUser(userData: {
    tenantId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string;
    mobileNo: string;
    dateOfBirth: string;
    alternateEmail?: string;
    motherTongue: string;
    securityQuestion1: string;
    securityAnswer1: string;
    securityQuestion2: string;
    securityAnswer2: string;
    isTenantAdmin: boolean;
    status: 'PENDING' | 'ACTIVE' | 'UNVERIFIED';
  }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const userQuery = `
        INSERT INTO users (
          email, password_hash, first_name, middle_name, last_name,
          gender, mobile_no, date_of_birth, alternate_email, mother_tongue,
          security_question_1, security_answer_1, security_question_2, security_answer_2
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, email, first_name, last_name;
      `;
      const userValues = [
        userData.email, userData.passwordHash, userData.firstName, userData.middleName || null, userData.lastName,
        userData.gender, userData.mobileNo, userData.dateOfBirth, userData.alternateEmail || null, userData.motherTongue,
        userData.securityQuestion1, userData.securityAnswer1, userData.securityQuestion2, userData.securityAnswer2
      ];
      
      const userRes = await client.query(userQuery, userValues);
      const newUser = userRes.rows[0];

      const wmQuery = `
        INSERT INTO workspace_memberships (user_id, tenant_id, status, is_tenant_admin)
        VALUES ($1, $2, $3, $4)
        RETURNING status, is_tenant_admin;
      `;
      const wmRes = await client.query(wmQuery, [newUser.id, userData.tenantId, userData.status, userData.isTenantAdmin]);
      const newWm = wmRes.rows[0];

      await client.query('COMMIT');

      return {
        id: newUser.id,
        tenant_id: userData.tenantId,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        status: newWm.status,
        is_tenant_admin: newWm.is_tenant_admin
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // FIXED: Joined workspace_memberships to filter by tenant and get status
  static async getUsersByTenant(tenantId: string) {
    const query = `
      SELECT u.id, u.email, u.first_name, u.last_name, wm.status, wm.is_tenant_admin, wm.joined_at as created_at
      FROM users u
      JOIN workspace_memberships wm ON u.id = wm.user_id
      WHERE wm.tenant_id = $1
      ORDER BY wm.joined_at DESC;
    `;
    const res = await pool.query(query, [tenantId]);
    return res.rows;
  }

  // FIXED: Joined workspace_memberships to verify tenant connection
  static async getUserByEmailAndTenant(email: string, tenantId: string) {
    const query = `
      SELECT u.*, wm.status, wm.is_tenant_admin, wm.tenant_id 
      FROM users u
      JOIN workspace_memberships wm ON u.id = wm.user_id
      WHERE u.email = $1 AND wm.tenant_id = $2;
    `;
    const res = await pool.query(query, [email, tenantId]);
    return res.rows[0];
  }

  // FIXED: Joined workspace_memberships to verify tenant connection
  static async getUserByIdAndTenant(userId: string, tenantId: string) {
    const query = `
      SELECT u.id, wm.tenant_id, u.email, u.first_name, u.last_name, wm.status, wm.is_tenant_admin 
      FROM users u 
      JOIN workspace_memberships wm ON u.id = wm.user_id 
      WHERE u.id = $1 AND wm.tenant_id = $2;
    `;
    const res = await pool.query(query, [userId, tenantId]);
    return res.rows[0];
  }

  // FIXED: Updated target table to workspace_memberships
  static async updateUserStatus(userId: string, tenantId: string, status: 'PENDING' | 'ACTIVE' | 'SUSPENDED') {
    const query = `
      UPDATE workspace_memberships 
      SET status = $3 
      WHERE user_id = $1 AND tenant_id = $2
      RETURNING user_id as id, status;
    `;
    const res = await pool.query(query, [userId, tenantId, status]);
    return res.rows[0];
  }

  // --- Refresh Tokens ---
  static async saveRefreshToken(userId: string, tenantId: string, tokenHash: string, expiresAt: Date) {
    // PostgreSQL expects a UUID for tenant_id. If this is the SuperAdmin ('SYSTEM'), store NULL.
    const dbTenantId = tenantId === 'SYSTEM' ? null : tenantId;

    const query = `
      INSERT INTO refresh_tokens (user_id, tenant_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4);
    `;
    await pool.query(query, [userId, dbTenantId, tokenHash, expiresAt]);
  }

  static async getRefreshToken(tokenHash: string) {
    const res = await pool.query('SELECT * FROM refresh_tokens WHERE token_hash = $1 AND is_revoked = FALSE', [tokenHash]);
    return res.rows[0];
  }

  static async revokeRefreshToken(tokenHash: string) {
    await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1', [tokenHash]);
  }

  static async cleanupExpiredTokens() {
    const query = `
      DELETE FROM refresh_tokens 
      WHERE is_revoked = TRUE OR expires_at < CURRENT_TIMESTAMP;
    `;
    const res = await pool.query(query);
    return res.rowCount; // Returns the number of rows deleted
  }

  // --- Invitations ---
  static async createInvitation(tenantId: string, email: string, tokenHash: string, invitedBy: string, expiresAt: Date) {
    const query = `
      INSERT INTO invitations (tenant_id, email, token_hash, invited_by, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, token_hash;
    `;
    const res = await pool.query(query, [tenantId, email, tokenHash, invitedBy, expiresAt]);
    return res.rows[0];
  }

  static async getInvitationByHash(tokenHash: string) {
    const query = `
      SELECT * FROM invitations 
      WHERE token_hash = $1 AND status = 'PENDING' AND expires_at > CURRENT_TIMESTAMP;
    `;
    const res = await pool.query(query, [tokenHash]);
    return res.rows[0];
  }

  static async updateInvitationStatus(id: string, status: 'ACCEPTED' | 'EXPIRED') {
    await pool.query('UPDATE invitations SET status = $2 WHERE id = $1', [id, status]);
  }

  // --- Modules & Assigning Access ---
  static async createModule(tenantId: string, name: string, description?: string) {
    const query = `
      INSERT INTO modules (tenant_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const res = await pool.query(query, [tenantId, name, description || null]);
    return res.rows[0];
  }

  static async getModulesByTenant(tenantId: string) {
    const res = await pool.query('SELECT * FROM modules WHERE tenant_id = $1', [tenantId]);
    return res.rows;
  }

  static async assignUserModule(userId: string, moduleId: string, assignedBy: string, accessLevel: 'READ' | 'WRITE' = 'READ') {
    const query = `
      INSERT INTO user_modules (user_id, module_id, assigned_by, access_level)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, module_id) 
      DO UPDATE SET access_level = EXCLUDED.access_level, assigned_by = EXCLUDED.assigned_by;
    `;
    await pool.query(query, [userId, moduleId, assignedBy, accessLevel]);
  }

  // FIXED: Checked status via workspace_memberships instead of users table
  static async getUserAccessibleModules(userId: string, tenantId: string) {
    const query = `
      SELECT m.id, m.name, m.description 
      FROM modules m
      INNER JOIN user_modules um ON m.id = um.module_id
      INNER JOIN users u ON um.user_id = u.id
      INNER JOIN workspace_memberships wm ON u.id = wm.user_id
      WHERE u.id = $1 AND wm.tenant_id = $2 AND wm.status = 'ACTIVE';
    `;
    const res = await pool.query(query, [userId, tenantId]);
    return res.rows;
  }

  // --- Audit Logs ---
  static async logEvent(tenantId: string | null, actorId: string | null, eventType: string, ip: string, userAgent: string, metadata: object) {
    const query = `
      INSERT INTO audit_logs (tenant_id, actor_id, event_type, ip_address, user_agent, metadata)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
    await pool.query(query, [tenantId, actorId, eventType, ip, userAgent, JSON.stringify(metadata)]);
  }

  static async getAuditLogs(tenantId: string, limit: number = 50) {
    const res = await pool.query(
      `SELECT a.id, a.event_type, a.ip_address, a.created_at, a.metadata, u.email as actor_email 
       FROM audit_logs a
       LEFT JOIN users u ON a.actor_id = u.id
       WHERE a.tenant_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2`,
      [tenantId, limit]
    );
    return res.rows;
  }

  // --- Password Update ---
  static async updateUserPassword(email: string, passwordHash: string) {
    const query = `
      UPDATE users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
      RETURNING id;
    `;
    const res = await pool.query(query, [email, passwordHash]);
    return res.rows[0];
  }

  // --- RBAC (ROLES & PERMISSIONS) ---
  static async getRoles(tenantId: string) {
    const res = await pool.query(
      `SELECT id, name, description, created_at 
       FROM roles 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC`,
      [tenantId]
    );
    return res.rows;
  }

  static async getPermissions(tenantId: string) {
    const res = await pool.query(
      `SELECT id, name, resource, description 
       FROM permissions 
       WHERE tenant_id = $1 
       ORDER BY resource, name`,
      [tenantId]
    );
    return res.rows;
  }

  static async createRole(tenantId: string, name: string, description: string) {
    const res = await pool.query(
      `INSERT INTO roles (tenant_id, name, description) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [tenantId, name, description]
    );
    return res.rows[0];
  }

  static async assignUserRole(userId: string, roleId: string, assignedBy: string) {
    const query = `
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `;
    await pool.query(query, [userId, roleId, assignedBy]);
  }

  // FIXED: Joined workspace_memberships to verify tenant filtering
  static async getRoleUsers(tenantId: string, roleId: string) {
    const res = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, wm.status 
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN workspace_memberships wm ON u.id = wm.user_id
       WHERE ur.role_id = $1 AND wm.tenant_id = $2
       ORDER BY u.first_name ASC`,
      [roleId, tenantId]
    );
    return res.rows;
  }

  static async revokeUserRole(userId: string, roleId: string) {
    const query = `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`;
    await pool.query(query, [userId, roleId]);
  }
  
  // FIXED: Joined workspace_memberships to verify tenant filtering
  static async getModuleUsers(tenantId: string, moduleId: string) {
    const res = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, wm.status, um.assigned_at, um.access_level
       FROM users u
       JOIN user_modules um ON u.id = um.user_id
       JOIN workspace_memberships wm ON u.id = wm.user_id
       WHERE um.module_id = $1 AND wm.tenant_id = $2
       ORDER BY u.first_name ASC`,
      [moduleId, tenantId]
    );
    return res.rows;
  }

  // FIXED: Subquery targets workspace_memberships instead of users table
  static async revokeModuleAccess(tenantId: string, userId: string, moduleId: string) {
    const res = await pool.query(
      `DELETE FROM user_modules 
       WHERE user_id = $1 AND module_id = $2 
       AND user_id IN (SELECT user_id FROM workspace_memberships WHERE tenant_id = $3)
       RETURNING *`,
      [userId, moduleId, tenantId]
    );
    return res.rows[0];
  }

  // --- SECURITY & SESSIONS ---
  static async getActiveSessions(tenantId: string) {
    const res = await pool.query(
      `SELECT r.id, r.created_at, r.expires_at, u.email, u.first_name, u.last_name
       FROM refresh_tokens r
       JOIN users u ON r.user_id = u.id
       WHERE r.tenant_id = $1 AND r.is_revoked = FALSE AND r.expires_at > NOW()
       ORDER BY r.created_at DESC`,
      [tenantId]
    );
    return res.rows;
  }

  static async revokeSession(tenantId: string, tokenId: string) {
    const res = await pool.query(
      `UPDATE refresh_tokens 
       SET is_revoked = TRUE 
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [tokenId, tenantId]
    );
    return res.rows[0];
  }

  // --- WORKSPACE SETTINGS (TENANT) ---
  static async getTenantSettings(tenantId: string) {
    const res = await pool.query(
      `SELECT id, company_name AS name, custom_domain, logo_url, theme_color, created_at 
       FROM tenants 
       WHERE id = $1`,
      [tenantId]
    );
    return res.rows[0];
  }

  static async updateTenantSettings(tenantId: string, data: { name: string; customDomain?: string; logoUrl?: string; themeColor?: string }) {
    const res = await pool.query(
      `UPDATE tenants 
       SET company_name = $1, 
           custom_domain = $2, 
           logo_url = $3, 
           theme_color = $4 
       WHERE id = $5 
       RETURNING id, company_name AS name, custom_domain, logo_url, theme_color`,
      [data.name, data.customDomain || null, data.logoUrl || null, data.themeColor || '#C7923E', tenantId]
    );
    return res.rows[0];
  }
}