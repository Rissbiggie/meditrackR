
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export async function sendLoginNotification(email: string, username: string) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'New Login Detected - MediTrack',
    html: `
      <h2>New Login Alert</h2>
      <p>Hello ${username},</p>
      <p>A new login was detected on your MediTrack account.</p>
      <p>If this wasn't you, please secure your account immediately.</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendWelcomeEmail(email: string, username: string) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Welcome to MediTrack - Account Created Successfully!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #50C878;">Welcome to MediTrack!</h2>
        <p>Hello ${username},</p>
        <p>Your MediTrack account has been created successfully! We're here to help you stay safe and connected during medical emergencies.</p>
        <p>With MediTrack, you can:</p>
        <ul>
          <li>Send emergency alerts instantly</li>
          <li>Get real-time assistance</li>
          <li>Manage your emergency contacts</li>
        </ul>
        <p>Best regards,<br>The MediTrack Team</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}
export async function sendStatusUpdateEmail(
  userEmail: string,
  status: string,
  description: string,
  facility: any | null
) {
  try {
    const statusMessages = {
      pending: "Your emergency request has been received and is being processed.",
      processing: "A response team has been assigned and is on the way.",
      completed: "Your emergency request has been fulfilled.",
      canceled: "Your emergency request has been canceled."
    };

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject: "MediTrack Emergency Request Update",
      html: `
        <h2>Emergency Request Update</h2>
        <p>${statusMessages[status] || "Your emergency request status has been updated."}</p>
        ${facility ? `<p><strong>Assigned Facility:</strong> ${facility.name}</p>` : ""}
        ${description ? `<p><strong>Additional Notes:</strong> ${description}</p>` : ""}
        <p>Stay safe,<br>MediTrack Emergency Response Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Status update email sent successfully to:', userEmail);
  } catch (error) {
    console.error('Failed to send status update email:', error);
    throw error;
  }
}
