import { masterLayout } from './master.layout';

export const passwordResetTemplate = (url: string) => {
    const content = `
        <h2 style="color: #111827; margin-top: 0;">Password Reset</h2>
        <p>You requested a password reset for your Flow account associated with <strong>AFORNIX</strong>.</p>
        <p>Click the link below to reset your password:</p>
        <div style="margin: 25px 0;">
            <a href="${url}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">If you didn't request this, please ignore this email.</p>
        <p style="font-size: 14px; color: #6b7280;">Link expires in 1 hour.</p>
    `;
    return masterLayout(content);
};
