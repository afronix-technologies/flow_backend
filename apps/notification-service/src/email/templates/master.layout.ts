export const masterLayout = (content: string, year: number = new Date().getFullYear()) => `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #3b82f6; padding: 20px; text-align: left;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Flow</h1>
        </div>
        <div style="padding: 30px; background-color: #fff; line-height: 1.6;">
            ${content}
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #eee;">
            <p style="margin: 0;">&copy; ${year} AFORNIX. All rights reserved.</p>
            <p style="margin: 5px 0 0;">Need help? Reply to this message.</p>
        </div>
    </div>
`;
