import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { config } from '@/config';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type TemplateOptions = {
  eyebrow: string;
  title: string;
  intro: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type UserMailTarget = {
  email: string;
  name?: string;
  notificationPreferences?: {
    emailNotifications?: boolean;
  };
};

const appName = 'DreamBoost';
const logoCid = 'dreamboost-logo';

const isConfigured = () =>
  Boolean(config.email.enabled && config.email.host && config.email.user && config.email.pass && config.email.from);

const transporter = () =>
  nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

const resolveLogoPath = () => {
  if (!config.email.logoPath) return '';
  return path.isAbsolute(config.email.logoPath)
    ? config.email.logoPath
    : path.resolve(process.cwd(), config.email.logoPath);
};

const getLogoHtml = () => {
  if (config.email.logoUrl) {
    return `<img src="${escapeHtml(config.email.logoUrl)}" width="172" alt="${appName}" style="display:block;max-width:172px;height:auto;border:0;" />`;
  }

  const logoPath = resolveLogoPath();
  if (logoPath && fs.existsSync(logoPath)) {
    return `<img src="cid:${logoCid}" width="172" alt="${appName}" style="display:block;max-width:172px;height:auto;border:0;" />`;
  }

  return `<div style="font-size:24px;font-weight:800;letter-spacing:0;color:#2563eb;">${appName}</div>`;
};

const getLogoAttachment = () => {
  if (config.email.logoUrl) return [];
  const logoPath = resolveLogoPath();
  if (!logoPath || !fs.existsSync(logoPath)) return [];
  return [{ filename: 'dreamboost-logo.png', path: logoPath, cid: logoCid }];
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const detailRow = (label: string, value: string | number) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">${escapeHtml(label)}</td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(String(value))}</td>
  </tr>
`;

const detailTable = (rows: Array<[string, string | number | undefined | null]>) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:16px;">
    ${rows.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value]) => detailRow(label, value as string | number)).join('')}
  </table>
`;

const statGrid = (items: Array<{ label: string; value: string | number; color?: string }>) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;margin:18px 0 6px;">
    <tr>
      ${items.map(item => `
        <td width="${Math.floor(100 / items.length)}%" style="padding:4px 6px 4px 0;">
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 10px;text-align:left;">
            <div style="font-size:18px;font-weight:700;color:${item.color || '#1d4ed8'};line-height:1.2;">${escapeHtml(String(item.value))}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:5px;">${escapeHtml(item.label)}</div>
          </div>
        </td>
      `).join('')}
    </tr>
  </table>
`;

const primaryButton = (label: string, href: string) => `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:22px;">
    <tr>
      <td bgcolor="#1d4ed8" style="border-radius:6px;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:11px 16px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>
`;

const wrapEmail = ({ eyebrow, title, intro, body, ctaLabel = 'Open DreamBoost', ctaHref = config.email.appUrl }: TemplateOptions) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-collapse:collapse;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:22px 26px 18px;background:#ffffff;border-bottom:1px solid #e5e7eb;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>${getLogoHtml()}</td>
                    <td align="right" style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(eyebrow)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#1d4ed8;padding:0;height:3px;line-height:3px;font-size:1px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:28px 28px 10px;">
                <h1 style="margin:0;color:#111827;font-size:24px;line-height:1.3;font-weight:700;">${escapeHtml(title)}</h1>
                <p style="margin:12px 0 0;color:#4b5563;font-size:15px;line-height:1.65;">${intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 28px 30px;color:#374151;font-size:15px;line-height:1.65;">
                ${body}
                ${ctaLabel && ctaHref ? primaryButton(ctaLabel, ctaHref) : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
                  You are receiving this because email notifications are enabled on your ${appName} account.
                </p>
                <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">${appName} | Learn, practice, and grow.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const sendEmail = async ({ to, subject, html, text }: EmailPayload): Promise<void> => {
  if (!isConfigured()) {
    console.warn(`[Email skipped] SMTP is not configured. To: ${to}, Subject: ${subject}`);
    return;
  }

  await transporter().sendMail({
    from: config.email.from,
    to,
    subject,
    html,
    text,
    attachments: getLogoAttachment(),
  });
};

const shouldNotify = (user: UserMailTarget) => user.notificationPreferences?.emailNotifications !== false;

const appLink = (pathName: string) => {
  const baseUrl = config.email.appUrl.replace(/\/$/, '');
  const cleanPath = pathName.startsWith('/') ? pathName : `/${pathName}`;
  return `${baseUrl}${cleanPath}`;
};

export const sendLoginEmail = async (user: UserMailTarget): Promise<void> => {
  if (!shouldNotify(user)) return;

  const displayName = user.name || 'Student';
  await sendEmail({
    to: user.email,
    subject: `${appName}: Login successful`,
    html: wrapEmail({
      eyebrow: 'Welcome back',
      title: 'Login successful',
      intro: `Hi ${escapeHtml(displayName)}, welcome back to ${appName}. Your learning dashboard is ready for you.`,
      body: `
        ${detailTable([
          ['Account', user.email],
          ['Login time', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
        <p style="font-size:15px;line-height:1.65;color:#475569;margin:18px 0 0;">
          Continue your preparation, review your progress, and pick up from where you left off.
          If this login was not done by you, please change your password immediately.
        </p>
      `,
      ctaLabel: 'Open Dashboard',
      ctaHref: appLink('/dashboard'),
    }),
    text: `Hi ${displayName}, login successful. Welcome back to ${appName}.`,
  });
};

export const sendPasswordResetEmail = async (
  user: UserMailTarget,
  reset: { code: string; expiresAt: Date }
): Promise<void> => {
  const displayName = user.name || 'Student';
  const expiry = reset.expiresAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  await sendEmail({
    to: user.email,
    subject: `${appName}: Password reset code`,
    html: wrapEmail({
      eyebrow: 'Password reset',
      title: 'Your reset code',
      intro: `Hi ${escapeHtml(displayName)}, use this 6-digit code to reset your ${appName} password.`,
      body: `
        <div style="margin:18px 0;padding:18px;border-radius:8px;background:#f9fafb;border:1px solid #e5e7eb;text-align:center;">
          <div style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Reset Code</div>
          <div style="margin-top:8px;font-size:32px;line-height:1;font-weight:800;letter-spacing:0.2em;color:#1d4ed8;">${escapeHtml(reset.code)}</div>
        </div>
        ${detailTable([
          ['Account', user.email],
          ['Valid until', expiry],
        ])}
        <p style="font-size:15px;line-height:1.65;color:#475569;margin:18px 0 0;">
          This code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email.
        </p>
      `,
      ctaLabel: 'Reset Password',
      ctaHref: appLink('/app/auth/forgot-password'),
    }),
    text: `Hi ${displayName}, your ${appName} password reset code is ${reset.code}. It is valid until ${expiry}.`,
  });
};

export const sendTestEnrollmentEmail = async (
  user: UserMailTarget,
  test: { name: string; category?: string; subject?: string; duration?: number }
): Promise<void> => {
  if (!shouldNotify(user)) return;

  await sendEmail({
    to: user.email,
    subject: `${appName}: Test enrollment confirmed`,
    html: wrapEmail({
      eyebrow: 'Enrollment confirmed',
      title: 'You are enrolled',
      intro: `Hi ${escapeHtml(user.name || 'Student')}, your enrollment is confirmed for <strong>${escapeHtml(test.name)}</strong>.`,
      body: `
        ${statGrid([
          { label: 'Duration', value: test.duration ? `${test.duration} min` : 'Flexible' },
          { label: 'Category', value: test.category || 'Test series' },
          { label: 'Subject', value: test.subject || 'General' },
        ])}
        ${detailTable([
          ['Test name', test.name],
          ['Category', test.category],
          ['Subject', test.subject],
          ['Duration', test.duration ? `${test.duration} minutes` : undefined],
        ])}
        <p style="font-size:15px;line-height:1.65;color:#475569;margin:18px 0 0;">
          You can start it from your tests section whenever you are ready.
        </p>
      `,
      ctaLabel: 'Start Learning',
      ctaHref: appLink('/tests'),
    }),
    text: `Your enrollment is confirmed for ${test.name}.`,
  });
};

export const sendSubscriptionPurchaseEmail = async (
  user: UserMailTarget,
  purchase: { plan: string; amount: number; currency?: string; endDate?: Date; transactionId?: string }
): Promise<void> => {
  if (!shouldNotify(user)) return;

  await sendEmail({
    to: user.email,
    subject: `${appName}: Purchase confirmed`,
    html: wrapEmail({
      eyebrow: 'Payment success',
      title: 'Purchase confirmed',
      intro: `Hi ${escapeHtml(user.name || 'Student')}, your <strong>${escapeHtml(purchase.plan)}</strong> plan is now active.`,
      body: `
        ${statGrid([
          { label: 'Plan', value: purchase.plan },
          { label: 'Amount', value: `${purchase.currency || 'INR'} ${purchase.amount}` },
          { label: 'Valid until', value: purchase.endDate ? purchase.endDate.toDateString() : 'Active' },
        ])}
        ${detailTable([
          ['Plan', purchase.plan],
          ['Amount paid', `${purchase.currency || 'INR'} ${purchase.amount}`],
          ['Transaction ID', purchase.transactionId],
          ['Valid until', purchase.endDate ? purchase.endDate.toDateString() : undefined],
        ])}
        <p style="font-size:15px;line-height:1.65;color:#475569;margin:18px 0 0;">
          Thank you for your purchase. Your premium access is ready to use.
        </p>
      `,
      ctaLabel: 'Open Dashboard',
      ctaHref: appLink('/dashboard'),
    }),
    text: `Your ${purchase.plan} plan purchase is confirmed.`,
  });
};

export const sendMaterialPurchaseEmail = async (
  user: UserMailTarget,
  purchase: { title: string; category?: string; amount: number; currency?: string; transactionId?: string }
): Promise<void> => {
  if (!shouldNotify(user)) return;

  await sendEmail({
    to: user.email,
    subject: `${appName}: Study material unlocked`,
    html: wrapEmail({
      eyebrow: 'Content unlocked',
      title: 'Study material unlocked',
      intro: `Hi ${escapeHtml(user.name || 'Student')}, your purchase for <strong>${escapeHtml(purchase.title)}</strong> is confirmed.`,
      body: `
        ${statGrid([
          { label: 'Material', value: purchase.title },
          { label: 'Category', value: purchase.category || 'Study material' },
          { label: 'Amount', value: `${purchase.currency || 'INR'} ${purchase.amount}` },
        ])}
        ${detailTable([
          ['Material', purchase.title],
          ['Category', purchase.category],
          ['Amount paid', `${purchase.currency || 'INR'} ${purchase.amount}`],
          ['Transaction ID', purchase.transactionId],
        ])}
        <p style="font-size:15px;line-height:1.65;color:#475569;margin:18px 0 0;">
          The material is now available in your study section.
        </p>
      `,
      ctaLabel: 'View Material',
      ctaHref: appLink('/study-materials'),
    }),
    text: `Your purchase for ${purchase.title} is confirmed.`,
  });
};

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Not recorded';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

export const sendTestCompletionEmail = async (
  user: UserMailTarget,
  result: {
    testName: string;
    category?: string;
    score: number;
    totalMarks: number;
    correctAnswers: number;
    wrongAnswers: number;
    skippedAnswers: number;
    accuracy: number;
    timeTaken: number;
    pointsEarned?: number;
    streakCount?: number;
  }
): Promise<void> => {
  if (!shouldNotify(user)) return;

  await sendEmail({
    to: user.email,
    subject: `${appName}: Test completed - ${result.testName}`,
    html: wrapEmail({
      eyebrow: 'Performance summary',
      title: 'Test completed',
      intro: `Hi ${escapeHtml(user.name || 'Student')}, you completed <strong>${escapeHtml(result.testName)}</strong>. Here is your quick performance summary.`,
      body: `
        ${statGrid([
          { label: 'Score', value: `${result.score}/${result.totalMarks}` },
          { label: 'Accuracy', value: `${Math.round(result.accuracy)}%`, color: '#16a34a' },
          { label: 'Time taken', value: formatDuration(result.timeTaken), color: '#7c3aed' },
        ])}
        ${detailTable([
          ['Test name', result.testName],
          ['Category', result.category],
          ['Correct answers', result.correctAnswers],
          ['Wrong answers', result.wrongAnswers],
          ['Skipped answers', result.skippedAnswers],
          ['Points earned', typeof result.pointsEarned === 'number' ? result.pointsEarned : undefined],
          ['Current streak', result.streakCount ? `${result.streakCount} day${result.streakCount === 1 ? '' : 's'}` : undefined],
        ])}
        <p style="font-size:15px;line-height:1.65;color:#475569;margin:18px 0 0;">
          Open your dashboard to review detailed performance and continue your preparation.
        </p>
      `,
      ctaLabel: 'Review Performance',
      ctaHref: appLink('/dashboard'),
    }),
    text: `You completed ${result.testName}. Score: ${result.score}/${result.totalMarks}, Accuracy: ${Math.round(result.accuracy)}%.`,
  });
};
