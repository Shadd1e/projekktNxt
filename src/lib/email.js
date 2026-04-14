const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL    = process.env.FROM_EMAIL    || "noreply@shaddies.space";
const FROM_NAME     = process.env.FROM_NAME     || "Projekkt";
const APP_URL       = process.env.NEXT_PUBLIC_APP_URL || "https://projekkt.shaddies.space";

async function sendEmail({ to, subject, htmlContent }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: FROM_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${err}`);
  }
  return true;
}

export async function sendVerificationCode(email, code) {
  return sendEmail({
    to: email,
    subject: "Your Projekkt verification code",
    htmlContent: `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:480px;margin:auto;padding:40px 32px;background:#0a0a0f;border-radius:12px;">
        <div style="margin-bottom:32px;">
          <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">PROJEKKT</span>
        </div>
        <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 12px;">Verify your email</h2>
        <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 28px;">
          Enter this code to activate your Projekkt account. It expires in 15 minutes.
        </p>
        <div style="font-size:40px;font-weight:800;letter-spacing:12px;background:#111827;padding:24px;border-radius:8px;text-align:center;color:#c8ff00;border:1px solid #1f2937;">
          ${code}
        </div>
        <p style="color:#6b7280;font-size:12px;margin-top:28px;">
          If you didn't create a Projekkt account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPaymentConfirmation(email, plan) {
  const planNames = { per_doc: "Per Document", weekly: "Weekly Unlimited", monthly: "Monthly Unlimited" };
  return sendEmail({
    to: email,
    subject: "Payment confirmed — Projekkt",
    htmlContent: `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:480px;margin:auto;padding:40px 32px;background:#0a0a0f;border-radius:12px;">
        <div style="margin-bottom:32px;">
          <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">PROJEKKT</span>
        </div>
        <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 12px;">Payment confirmed ✓</h2>
        <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Your <strong style="color:#c8ff00;">${planNames[plan] || plan}</strong> plan is now active.
          Upload your document and we'll handle the rest.
        </p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 28px;background:#c8ff00;color:#0a0a0f;font-weight:700;font-size:14px;border-radius:6px;text-decoration:none;">
          Go to Dashboard →
        </a>
      </div>
    `,
  });
}

export async function sendDocumentReady(email, jobId) {
  return sendEmail({
    to: email,
    subject: "Your document is ready — Projekkt",
    htmlContent: `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:480px;margin:auto;padding:40px 32px;background:#0a0a0f;border-radius:12px;">
        <div style="margin-bottom:32px;">
          <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">PROJEKKT</span>
        </div>
        <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 12px;">Your document is ready</h2>
        <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 8px;">
          Processing is complete. Download your corrected document now.
        </p>
        <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">
          ⏱ File expires in 1 hour for your privacy.
        </p>
        <a href="${APP_URL}/dashboard?job=${jobId}" style="display:inline-block;padding:14px 28px;background:#c8ff00;color:#0a0a0f;font-weight:700;font-size:14px;border-radius:6px;text-decoration:none;">
          Download Now →
        </a>
      </div>
    `,
  });
}
