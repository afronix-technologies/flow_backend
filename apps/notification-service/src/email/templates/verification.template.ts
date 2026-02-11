import { masterLayout } from './master.layout';

export const verificationTemplate = (code: string) => {
  const content = `
        <h2 style="color: #111827; margin-top: 0;">Welcome to Flow!</h2>
        <p>Thanks for joining <strong>AFORNIX</strong>.</p>
        <p>Please use the following code to verify your email address:</p>
        <div style="margin: 25px 0;">
            <div style="background-color: #f3f4f6; color: #1f2937; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 24px; letter-spacing: 5px;">
                ${code}
            </div>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Code expires in 24 hours.</p>
    `;
  return masterLayout(content);
};
