function wrapEmail({ title, preheader, body, ctaText, ctaUrl }) {
  return {
    text: `${title}\n\n${preheader}\n\n${body}\n\nOpen: ${ctaUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#050b16;padding:24px;color:#e5edf8">
        <div style="max-width:620px;margin:0 auto;background:#091425;border:1px solid rgba(148,163,184,0.16);border-radius:24px;padding:28px">
          <p style="margin:0 0 10px;color:#93a4ba;text-transform:uppercase;letter-spacing:.16em;font-size:12px">${title}</p>
          <h1 style="margin:0 0 14px;font-size:28px;line-height:1.05">${preheader}</h1>
          <p style="margin:0 0 20px;color:#c7d3e3;line-height:1.6">${body}</p>
          <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#88d8ff,#1aa7f1);color:#00111f;text-decoration:none;font-weight:700;border-radius:999px;padding:12px 18px">${ctaText}</a>
          <p style="margin:18px 0 0;color:#93a4ba;font-size:13px;line-height:1.5">If the button does not work, copy and paste this link into your browser:</p>
          <p style="margin:8px 0 0;word-break:break-all;color:#88d8ff">${ctaUrl}</p>
        </div>
      </div>
    `,
  };
}

export function buildVerificationEmail({ name, verificationUrl }) {
  return wrapEmail({
    title: "Personal Expense Tracker",
    preheader: `Verify your email, ${name}`,
    body: "Please confirm this email address so we can activate your account and keep your expense data protected.",
    ctaText: "Verify email",
    ctaUrl: verificationUrl,
  });
}

export function buildResetPasswordEmail({ name, resetUrl }) {
  return wrapEmail({
    title: "Personal Expense Tracker",
    preheader: `Reset your password, ${name}`,
    body: "We received a request to reset your password. Use the secure link below to choose a new one.",
    ctaText: "Reset password",
    ctaUrl: resetUrl,
  });
}

