import nodemailer from 'nodemailer';

// Create a transporter object using Gmail's SMTP settings.
// The credentials are read from environment variables for security.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // vivimap.earth@gmail.com
        pass: process.env.EMAIL_PASS, // 16-letter app password
    },
});

/**
 * Sends a real verification email to the user with a 5-digit code.
 * @param to - The recipient's email address.
 * @param code - The 5-digit verification code.
 */
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
    const mailOptions = {
        from: `"Vivimap" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Your Vivimap Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 15px;">
                        <h1 style="color: #10B981; margin: 0; font-size: 28px;">Vivimap</h1>
                    </div>
                    <h2 style="font-size: 24px; color: #333;">Confirm Your Email Address</h2>
                    <p>Welcome to Vivimap! To complete your registration and secure your account, please use the verification code below.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #10B981; background-color: #f0fdf4; padding: 15px 20px; border-radius: 8px; display: inline-block;">
                            ${code}
                        </p>
                    </div>
                    <p>This code will expire in <strong>5 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Vivimap. All rights reserved.</p>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email successfully sent to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        // This error is caught by the calling function in server.ts,
        // preventing a failed email from crashing the signup process.
        throw new Error('Failed to send verification email.');
    }
}
