import { masterLayout } from './master.layout';

export const deletionConfirmationTemplate = (
  confirmationUrl: string,
  expiresInDays: number = 7,
) => {
  const content = `
        <h2 style="color: #111827; margin-top: 0;">Confirm Your Data Deletion Request</h2>
        <p>We received a request to permanently delete all your personal data from Flow.</p>
        <p><strong>This action is irreversible.</strong> Once confirmed, all your data including projects, tasks, and profile information will be permanently removed.</p>
        <p>This confirmation link will expire in <strong>${expiresInDays} days</strong>.</p>
        <div style="margin: 25px 0;">
            <a href="${confirmationUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirm Data Deletion</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #3b82f6; word-break: break-all;">${confirmationUrl}</p>
        <p style="font-size: 14px; color: #6b7280;">If you did not request data deletion, you can safely ignore this email. Your data will not be deleted.</p>
    `;
  return masterLayout(content);
};
