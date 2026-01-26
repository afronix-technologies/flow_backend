import { masterLayout } from './master.layout';

export const welcomeTemplate = (firstName: string, dashboardUrl: string) => {
    const content = `
        <h2 style="color: #111827; margin-top: 0;">Welcome, ${firstName}!</h2>
        <p>We're excited to have you on board with <strong>Flow</strong> by <strong>AFORNIX</strong>.</p>
        <p>Get started by exploring your dashboard.</p>
        <div style="margin: 25px 0;">
            <a href="${dashboardUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
        </div>
    `;
    return masterLayout(content);
};
