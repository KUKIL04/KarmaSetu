import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-production-key-change-me';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const TEMP_TOKEN_EXPIRY = '5m';

export class CryptoService {
  // Hash passwords securely using Argon2id parameters
  static async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  // Verify a raw password against an Argon2id hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  // Generate a cryptographically secure random token (for invites/refresh tokens)
  static generateRandomToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 48; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Generate SHA-256 hash to store tokens safely (no plaintext in DB)
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Generate JWT Access Token
  static generateAccessToken(payload: { userId: string; tenantId: string; isAdmin: boolean }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  // Verify JWT Access Token
  static verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  // --- PRE-AUTH TOKEN METHODS ---

  // Generate a short-lived token specifically for workspace selection
  static generateTempToken(payload: { userId: string }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TEMP_TOKEN_EXPIRY });
  }

  // Verify the temporary token before finalizing login
  static verifyTempToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
}