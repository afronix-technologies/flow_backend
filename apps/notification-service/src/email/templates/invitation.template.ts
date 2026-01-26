import { masterLayout } from './master.layout';

export const invitationTemplate = (url: string, organizationName: string) => {
    const content = `
        <p style="margin-top: 0;">Hi!</p>
        <p>You've been added to <strong>${organizationName}</strong>'s team on Flow.</p>
        <p>Download the app to see your tasks and track your time:</p>
        <div style="margin: 25px 0;">
            <a href="${url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Team</a>
        </div>
        <p style="font-size: 14px;">Or copy this link: <a href="${url}" style="color: #3b82f6;">${url}</a></p>
    `;
    return masterLayout(content);
};
