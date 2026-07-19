import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: nodemailer.Transporter;

  // Initialize the Ethereal SMTP transporter dynamically
  private static async getTransporter() {
    if (!this.transporter) {
      // Automatically generates a temporary Ethereal account for local dev
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, 
        auth: {
          user: testAccount.user, // e.g., 'vicky.stark@ethereal.email'
          pass: testAccount.pass,
        },
      });
      console.log(`✉️ Ethereal Email Ready: ${testAccount.user}`);
    }
    return this.transporter;
  }

  // --- 1. OTP Email ---
  static async sendOtpEmail(to: string, otp: string) {
    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: '"Workspace Security" <security@yourcompany.com>',
        to,
        subject: 'Your Matrix Security Code',
        text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #334155;">
            <h2 style="color: #e49b0f;">Workspace Security</h2>
            <p>You requested a secure action on your account.</p>
            <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">${otp}</strong></p>
            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">This code expires in 10 minutes. If you did not request this, please contact your administrator.</p>
          </div>
        `
      });

      console.log("\n-----------------------------------------");
      console.log(`📩 OTP sent to ${to}`);
      console.log("🔗 Preview URL: %s", nodemailer.getTestMessageUrl(info));
      console.log("-----------------------------------------\n");
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      throw new Error("Email dispatch failed");
    }
  }

  // --- 2. Invitation Email ---
  static async sendInviteEmail(to: string, inviteLink: string) {
    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: '"HR Command" <hr@yourcompany.com>',
        to,
        subject: 'Invitation to Join Workspace',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #334155;">
            <h2 style="color: #e49b0f;">Welcome to the Team!</h2>
            <p>You have been invited to set up your corporate workspace account.</p>
            <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #e49b0f; color: white; text-decoration: none; font-weight: bold; border-radius: 8px; margin: 20px 0;">Accept Invitation</a>
            <p style="font-size: 12px; color: #64748b;">This link will expire securely. Do not share it with anyone.</p>
          </div>
        `
      });
      console.log(`\n📩 Invite sent to ${to}\n🔗 Preview: %s\n`, nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error("Failed to send invite email:", error);
    }
  }

  // --- 3. Status Change Notification ---
  static async sendStatusChangeEmail(to: string, newStatus: string) {
    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: '"Workspace Admin" <admin@yourcompany.com>',
        to,
        subject: 'Account Status Update',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #334155;">
            <h2 style="color: #e49b0f;">Account Update</h2>
            <p>Your workspace account is <strong style="text-transform: uppercase;">${newStatus}</strong></p>
            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">If you have questions, please contact your HR department.</p>
          </div>
        `
      });
      console.log(`\n📩 Status update sent to ${to}\n🔗 Preview: %s\n`, nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error("Failed to send status email:", error);
    }
  }

  // --- 4. Account Unlocked Notification ---
  static async sendLockoutClearedEmail(to: string) {
    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: '"Workspace Security" <security@yourcompany.com>',
        to,
        subject: 'Account Unlocked',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #334155;">
            <h2 style="color: #16a34a;">Account Unlocked</h2>
            <p>Your workspace administrator has successfully cleared your security lockout.</p>
            <p>You may now return to the login portal and securely access your account.</p>
            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">If you do not remember your password, please use the Forgot Password link on the login screen.</p>
          </div>
        `
      });
      console.log(`\n📩 Lockout cleared email sent to ${to}\n🔗 Preview: %s\n`, nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error("Failed to send lockout cleared email:", error);
    }
  }

  // --- 5. Force Password Reset Notification ---
  static async sendForceResetNotification(to: string) {
    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: '"Workspace Security" <security@yourcompany.com>',
        to,
        subject: 'Mandatory Password Reset Required',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #334155;">
            <h2 style="color: #ef4444;">Security Alert: Password Reset Required</h2>
            <p>Your workspace administrator has invalidated your current password for security reasons.</p>
            <p><strong>All your active network sessions have been terminated.</strong></p>
            <p style="margin-top: 20px;">Please navigate to the portal and use the <strong>Forgot Password</strong> link to set up a new secure credential.</p>
          </div>
        `
      });
      console.log(`\n📩 Force reset notification sent to ${to}\n🔗 Preview: %s\n`, nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error("Failed to send force reset email:", error);
    }
  }
  
}