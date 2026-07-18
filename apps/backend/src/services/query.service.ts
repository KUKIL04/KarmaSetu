import { pool } from '../db/index.js';

export class QueryService {
  // --- Tenants ---
  static async createTenant(companyName: string, domain?: string, logoUrl?: string, themeColor?: string) {
    const query = `
      INSERT INTO tenants (company_name, custom_domain, logo_url, theme_color)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const res = await pool.query(query, [companyName, domain || null, logoUrl || null, themeColor || '#000000']);
    return res.rows[0];
  }

  static async getTenantById(tenantId: string) {
    const res = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    return res.rows[0];
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
    const query = `
      INSERT INTO users (
        tenant_id, email, password_hash, first_name, middle_name, last_name,
        gender, mobile_no, date_of_birth, alternate_email, mother_tongue,
        security_question_1, security_answer_1, security_question_2, security_answer_2,
        is_tenant_admin, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, tenant_id, email, first_name, last_name, status, is_tenant_admin;
    `;
    const values = [
      userData.tenantId, userData.email, userData.passwordHash, userData.firstName, userData.middleName || null, userData.lastName,
      userData.gender, userData.mobileNo, userData.dateOfBirth, userData.alternateEmail || null, userData.motherTongue,
      userData.securityQuestion1, userData.securityAnswer1, userData.securityQuestion2, userData.securityAnswer2,
      userData.isTenantAdmin, userData.status
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async getUsersByTenant(tenantId: string) {
    const query = `
      SELECT id, email, first_name, last_name, status, is_tenant_admin, created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC;
    `;
    const res = await pool.query(query, [tenantId]);
    return res.rows;
  }

  static async getUserByEmailAndTenant(email: string, tenantId: string) {
    const res = await pool.query('SELECT * FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
    return res.rows[0];
  }

  static async getUserByIdAndTenant(userId: string, tenantId: string) {
    const query = 'SELECT id, tenant_id, email, first_name, last_name, status, is_tenant_admin FROM users WHERE id = $1 AND tenant_id = $2';
    const res = await pool.query(query, [userId, tenantId]);
    return res.rows[0];
  }

  static async updateUserStatus(userId: string, tenantId: string, status: 'PENDING' | 'ACTIVE' | 'SUSPENDED') {
    const query = `
      UPDATE users SET status = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, status;
    `;
    const res = await pool.query(query, [userId, tenantId, status]);
    return res.rows[0];
  }

  // --- Refresh Tokens ---
  static async saveRefreshToken(userId: string, tenantId: string, tokenHash: string, expiresAt: Date) {
    const query = `
      INSERT INTO refresh_tokens (user_id, tenant_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4);
    `;
    await pool.query(query, [userId, tenantId, tokenHash, expiresAt]);
  }

  static async getRefreshToken(tokenHash: string) {
    const res = await pool.query('SELECT * FROM refresh_tokens WHERE token_hash = $1 AND is_revoked = FALSE', [tokenHash]);
    return res.rows[0];
  }

  static async revokeRefreshToken(tokenHash: string) {
    await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1', [tokenHash]);
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

  static async getUserAccessibleModules(userId: string, tenantId: string) {
    const query = `
      SELECT m.id, m.name, m.description 
      FROM modules m
      INNER JOIN user_modules um ON m.id = um.module_id
      INNER JOIN users u ON um.user_id = u.id
      WHERE u.id = $1 AND u.tenant_id = $2 AND u.status = 'ACTIVE';
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

  // Fetch audit logs with the actor's email attached
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

  // --- ROLE ASSIGNMENTS ---

  // Assign a role to a user
  static async assignUserRole(userId: string, roleId: string, assignedBy: string) {
    const query = `
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `;
    await pool.query(query, [userId, roleId, assignedBy]);
  }

  // Fetch users assigned to a specific role
  static async getRoleUsers(tenantId: string, roleId: string) {
    const res = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status 
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE ur.role_id = $1 AND u.tenant_id = $2
       ORDER BY u.first_name ASC`,
      [roleId, tenantId]
    );
    return res.rows;
  }

  // Revoke a role from a user
  static async revokeUserRole(userId: string, roleId: string) {
    const query = `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`;
    await pool.query(query, [userId, roleId]);
  }
  
  // --- REVERSE MODULE MAPPING ---

  static async getModuleUsers(tenantId: string, moduleId: string) {
    const res = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status, um.assigned_at, um.access_level
       FROM users u
       JOIN user_modules um ON u.id = um.user_id
       WHERE um.module_id = $1 AND u.tenant_id = $2
       ORDER BY u.first_name ASC`,
      [moduleId, tenantId]
    );
    return res.rows;
  }

  static async revokeModuleAccess(tenantId: string, userId: string, moduleId: string) {
    const res = await pool.query(
      `DELETE FROM user_modules 
       WHERE user_id = $1 AND module_id = $2 
       AND user_id IN (SELECT id FROM users WHERE tenant_id = $3)
       RETURNING *`,
      [userId, moduleId, tenantId]
    );
    return res.rows[0];
  }

  // --- SECURITY & SESSIONS ---

  static async getActiveSessions(tenantId: string) {
    // Only fetch tokens that are not revoked and haven't expired yet
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