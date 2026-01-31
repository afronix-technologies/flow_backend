import { masterLayout } from './master.layout';

export const verificationTemplate = (url: string) => {
  const content = `
        <h2 style="color: #111827; margin-top: 0;">Welcome to Flow!</h2>
        <p>Thanks for joining <strong>AFORNIX</strong>.</p>
        <p>Please verify your email address by clicking the link below:</p>
        <div style="margin: 25px 0;">
            <a href="${url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Link expires in 24 hours.</p>
    `;
  return masterLayout(content);
};
