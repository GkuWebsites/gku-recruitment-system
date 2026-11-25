import nodemailer from 'nodemailer';

export interface SmtpConfig {
  host?: string;
  port?: number;
  user: string;
  pass: string;
  senderName?: string;
}

export interface OfferEmailPayload {
  candidateName: string;
  candidateEmail: string;
  postTitle: string;
  department: string;
  offerRef: string;
  offeredCtc: string;
  joiningDeadline: string;
  placeOfPosting?: string;
  reportingHead?: string;
  specialClauses?: string;
  senderName: string;
  senderEmail: string;
  replyTo?: string;
  ccList?: string[];
  smtpConfig: SmtpConfig;
}

/**
 * Creates a Nodemailer transporter configured for Google Workspace or custom SMTP
 */
export function getMailTransporter(config: SmtpConfig) {
  const host = config.host || 'smtp.gmail.com';
  const port = config.port || 465;
  const isSecure = port === 465;

  // Clean any spaces often accidentally copied into Google App Passwords
  const cleanPass = (config.pass || '').replace(/\s+/g, '');
  const cleanUser = (config.user || '').trim();

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user: cleanUser,
      pass: cleanPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Tests an SMTP connection by verifying credentials and optionally sending a test email
 */
export async function verifySmtpConnection(config: SmtpConfig, testRecipient?: string): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = getMailTransporter(config);
    await transporter.verify();

    if (testRecipient) {
      const cleanPass = (config.pass || '').replace(/\s+/g, '');
      await transporter.sendMail({
        from: `"${config.senderName || 'GKU Recruitment'}" <${config.user}>`,
        to: testRecipient,
        subject: 'Guru Kashi University - Mailbox Verification Successful',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f2942; color: #ffffff; padding: 20px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px;">GURU KASHI UNIVERSITY</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Talwandi Sabo, Bathinda, Punjab • NAAC A++ Accredited</p>
            </div>
            <div style="padding: 24px; color: #1e293b;">
              <h3 style="color: #059669; margin-top: 0;">✓ Outgoing Mailbox Connected Successfully!</h3>
              <p>This confirms that your official university email account <strong>${config.user}</strong> is authenticated and ready to dispatch formal appointment and offer letters directly through your Google Workspace account.</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Sender Desk:</strong> ${config.senderName || 'Official Desk'}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;"><strong>Configured Account:</strong> ${config.user}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
              <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">You can now issue confidential appointment letters from your dedicated desk.</p>
            </div>
            <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #64748b;">
              Guru Kashi University Institutional Recruitment Portal
            </div>
          </div>
        `
      });
    }

    return { success: true, message: testRecipient ? `Connection verified and test email sent to ${testRecipient}` : 'SMTP credentials verified successfully.' };
  } catch (error: any) {
    let msg = error.message || 'SMTP Authentication failed';
    if (msg.includes('Username and Password not accepted') || msg.includes('BadCredentials')) {
      msg = 'Google rejected the credentials. Please verify your 16-character Google App Password (ensure 2-Step Verification is ON in your Google Account).';
    }
    return { success: false, message: msg };
  }
}

/**
 * Sends a formal university offer letter email to a candidate
 */
export async function sendOfferLetterEmail(payload: OfferEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getMailTransporter(payload.smtpConfig);

    const senderDisplay = `"${payload.senderName}" <${payload.senderEmail}>`;
    const replyTo = payload.replyTo || payload.senderEmail;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0b1f3a; color: #ffffff; padding: 32px 24px; text-align: center; border-bottom: 4px solid #eab308; }
          .logo-text { font-size: 24px; font-weight: 800; letter-spacing: 1px; margin: 0; }
          .sub-text { font-size: 13px; color: #94a3b8; margin: 4px 0 0 0; }
          .badge { display: inline-block; background: #eab308; color: #0b1f3a; font-weight: bold; font-size: 11px; padding: 3px 10px; border-radius: 12px; margin-top: 8px; }
          .content { padding: 32px 28px; }
          .salutation { font-size: 17px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
          .intro { font-size: 15px; color: #334155; margin-bottom: 24px; }
          .details-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
          .details-card table { width: 100%; border-collapse: collapse; }
          .details-card td { padding: 8px 12px; font-size: 14px; border-bottom: 1px solid #edf2f7; }
          .details-card td:last-child { border-bottom: none; }
          .details-card tr:last-child td { border-bottom: none; }
          .label { color: #64748b; font-weight: 600; width: 38%; }
          .val { color: #0f172a; font-weight: 600; }
          .highlight-val { color: #059669; font-weight: 700; font-size: 15px; }
          .remarks-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 4px; font-size: 13px; color: #1e40af; margin-bottom: 24px; }
          .action-box { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; background: #0b1f3a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
          .signature-section { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 28px; }
          .sign-name { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0; }
          .sign-role { font-size: 13px; color: #64748b; margin: 2px 0 0 0; }
          .sign-org { font-size: 13px; color: #0284c7; margin: 2px 0 0 0; font-weight: 500; }
          .footer { background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo-text">GURU KASHI UNIVERSITY</h1>
            <p class="sub-text">Sardulgarh Road, Talwandi Sabo, Bathinda, Punjab - 151302</p>
            <span class="badge">NAAC A++ ACCREDITED UNIVERSITY</span>
          </div>

          <div class="content">
            <div class="salutation">Dear ${payload.candidateName},</div>
            
            <p class="intro">
              On behalf of Guru Kashi University, we are pleased to offer you the formal appointment for the position of 
              <strong>${payload.postTitle}</strong> in the <strong>${payload.department}</strong>.
            </p>

            <div class="details-card">
              <table>
                <tr>
                  <td class="label">Offer Reference No.</td>
                  <td class="val">${payload.offerRef}</td>
                </tr>
                <tr>
                  <td class="label">Designation / Role</td>
                  <td class="val">${payload.postTitle}</td>
                </tr>
                <tr>
                  <td class="label">Department / Faculty</td>
                  <td class="val">${payload.department}</td>
                </tr>
                <tr>
                  <td class="label">Annual Remuneration (CTC)</td>
                  <td class="highlight-val">${payload.offeredCtc}</td>
                </tr>
                <tr>
                  <td class="label">Place of Posting</td>
                  <td class="val">${payload.placeOfPosting || 'GKU Main Campus, Talwandi Sabo, Punjab'}</td>
                </tr>
                <tr>
                  <td class="label">Reporting Authority</td>
                  <td class="val">${payload.reportingHead || 'Dean of Faculty / Registrar'}</td>
                </tr>
                <tr>
                  <td class="label">Joining Deadline</td>
                  <td class="val" style="color: #dc2626;">${payload.joiningDeadline}</td>
                </tr>
              </table>
            </div>

            ${payload.specialClauses ? `
            <div class="remarks-box">
              <strong>Terms & Conditions of Appointment:</strong><br/>
              ${payload.specialClauses}
            </div>
            ` : ''}

            <p style="font-size: 14px; color: #334155;">
              Kindly review the appointment terms. Please confirm your acceptance by replying directly to this email or submitting your countersigned copy before the joining deadline.
            </p>

            <div class="signature-section">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">With Warm Regards,</p>
              <p class="sign-name">${payload.senderName}</p>
              <p class="sign-role">Directorate of HR & Executive Affairs</p>
              <p class="sign-org">Guru Kashi University, Punjab</p>
              <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Official Institutional Email: <a href="mailto:${payload.senderEmail}" style="color: #0284c7;">${payload.senderEmail}</a></p>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">This is an official communication dispatched from the Guru Kashi University Recruitment & Human Resources Management System.</p>
            <p style="margin: 4px 0 0 0;">For inquiries or assistance, reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions: any = {
      from: senderDisplay,
      to: payload.candidateEmail,
      replyTo,
      subject: `Formal Appointment Offer: ${payload.postTitle} - Guru Kashi University [Ref: ${payload.offerRef}]`,
      html: htmlContent
    };

    if (Array.isArray(payload.ccList) && payload.ccList.length > 0) {
      mailOptions.cc = payload.ccList.join(', ');
    }

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to dispatch offer email' };
  }
}
