import { masterLayout } from './master.layout';

export const dataExportReadyTemplate = (downloadUrl: string, expiresInHours: number = 24) => {
  const content = `
        <h2 style="color: #111827; margin-top: 0;">Your Data Export is Ready</h2>
        <p>Your personal data export has been generated and is ready for download.</p>
        <p>This link will expire in <strong>${expiresInHours} hours</strong>. Please download your data before then.</p>
        <div style="margin: 25px 0;">
            <a href="${downloadUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download My Data</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #3b82f6; word-break: break-all;">${downloadUrl}</p>
        <p style="font-size: 14px; color: #6b7280;">If you did not request a data export, please contact support immediately.</p>
    `;
  return masterLayout(content);
};
