const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'noreply@attendly.com';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
};

const sendActivationEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Your Attendly account is now active',
    html: `
      <h2>Welcome to Attendly, ${user.name}!</h2>
      <p>Your account has been activated by your HR admin. You can now log in.</p>
      <a href="${CLIENT_URL}/login">Sign in to Attendly</a>
    `,
  });
};

const sendSetPasswordEmail = async (user, token) => {
  const link = `${CLIENT_URL}/set-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Set your Attendly password',
    html: `
      <h2>Hello ${user.name},</h2>
      <p>Your HR admin has created an account for you on Attendly. Click the link below to set your password.</p>
      <a href="${link}">Set Password</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const link = `${CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your Attendly password',
    html: `
      <h2>Hello ${user.name},</h2>
      <p>We received a request to reset your password. Click the link below.</p>
      <a href="${link}">Reset Password</a>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
  });
};

const sendLeaveDecisionEmail = async (user, leave, decision, comment) => {
  const status = decision === 'approved' ? 'approved ✅' : 'rejected ❌';
  await sendEmail({
    to: user.email,
    subject: `Your leave request has been ${decision}`,
    html: `
      <h2>Hello ${user.name},</h2>
      <p>Your leave request (${leave.start_date} → ${leave.end_date}) has been <strong>${status}</strong>.</p>
      ${comment ? `<p>Admin note: ${comment}</p>` : ''}
      <a href="${CLIENT_URL}/my-leaves">View your leaves</a>
    `,
  });
};

const sendDeductionEmail = async (user, deduction) => {
  await sendEmail({
    to: user.email,
    subject: 'Salary deduction applied this month',
    html: `
      <h2>Hello ${user.name},</h2>
      <p>A salary deduction has been applied for this month due to late arrivals.</p>
      <p><strong>Late count:</strong> ${deduction.late_count}</p>
      <p><strong>Total deduction:</strong> ₦${deduction.total_deduction.toLocaleString()}</p>
      <a href="${CLIENT_URL}/deductions">View your deductions</a>
    `,
  });
};

const sendPendingApprovalEmail = async (user, companyName) => {
  await sendEmail({
    to: user.email,
    subject: "Registration received - pending admin approval",
    html: `
      <h2>Hello ${user.name},</h2>
      <p>Your Attendly registration for <strong>${companyName}</strong> was received successfully.</p>
      <p>Your account is currently pending approval by an admin. You will get another email once activated.</p>
      <a href="${CLIENT_URL}/awaiting-activation">Check status</a>
    `,
  });
};

const sendAdminPendingRegistrationEmail = async (admin, newUser, companyName) => {
  await sendEmail({
    to: admin.email,
    subject: "New staff registration pending approval",
    html: `
      <h2>Hello ${admin.name},</h2>
      <p>A new staff registration is waiting for approval in <strong>${companyName}</strong>.</p>
      <p><strong>Name:</strong> ${newUser.name}</p>
      <p><strong>Email:</strong> ${newUser.email}</p>
      <a href="${CLIENT_URL}/admin/staff">Review pending staff</a>
    `,
  });
};

module.exports = {
  sendActivationEmail,
  sendSetPasswordEmail,
  sendPasswordResetEmail,
  sendLeaveDecisionEmail,
  sendDeductionEmail,
  sendPendingApprovalEmail,
  sendAdminPendingRegistrationEmail,
};