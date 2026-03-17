import sgMail from "@sendgrid/mail";

let configured = false;

function getFromAddress() {
  const email = process.env.EMAIL_FROM;
  const name = process.env.EMAIL_NAME;

  if (!email) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  if (!name) {
    throw new Error("EMAIL_NAME is not configured.");
  }

  return { email, name };
}

function configureSendGrid() {
  if (configured) return;

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is not configured.");
  }

  sgMail.setApiKey(apiKey);
  configured = true;
}

export async function sendLoginEmail(to: string, link: string) {
  configureSendGrid();

  await sgMail.send({
    to,
    from: getFromAddress(),
    subject: "Sign in to your Campaign Tracker account",
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sign in to Campaign Tracker</title>
  </head>
  <body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="background:#f9fafb;padding:40px 16px;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;padding:32px;border-radius:8px;">
        <h2 style="margin:0 0 16px;color:#111827;">Campaign Tracker</h2>
        <p style="margin:0 0 16px;color:#374151;line-height:1.6;">
          We received a request to sign in to your account.
        </p>
        <div style="margin:24px 0;text-align:center;">
          <a
            href="${link}"
            style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;"
          >
            Sign in to your account
          </a>
        </div>
        <p style="margin:0 0 16px;font-size:12px;color:#6b7280;line-height:1.6;">
          If the button does not work, copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 24px;font-size:11px;color:#9ca3af;word-break:break-all;line-height:1.6;">
          ${link}
        </p>
        <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
          If you did not request this email, you can safely ignore it.
        </p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eeeeee;" />
        <p style="margin:0;font-size:11px;color:#9ca3af;">campaign-tracker.com</p>
      </div>
    </div>
  </body>
</html>`,
  });
}
