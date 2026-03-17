import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(email: string, magicLink: string) {
  const from =
    process.env.RESEND_FROM ?? "Campaign Tracker <noreply@campaign-tracker.com>";

  const { error } = await resend.emails.send({
    from,
    to: [email],
    subject: "Sign in to Campaign Tracker",
    html: buildEmailHtml(magicLink),
  });

  if (error) {
    throw new Error(error.message ?? "Failed to send sign-in email");
  }
}

function buildEmailHtml(magicLink: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sign in to Campaign Tracker</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f1ec;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #ddd9d0;">

          <!-- Header -->
          <tr>
            <td style="background:#0b1020;padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#f3f0e8;letter-spacing:-0.01em;">
                Campaign Tracker
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111;letter-spacing:-0.01em;">
                Your sign-in link
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#555;line-height:1.6;">
                Click the button below to sign in to Campaign Tracker.
                This link is valid for 1&nbsp;hour and can only be used once.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#0b1020;border-radius:6px;">
                    <a href="${magicLink}"
                       style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#f3f0e8;text-decoration:none;letter-spacing:0.01em;">
                      Sign in to Campaign Tracker
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 6px;font-size:12px;color:#999;">
                Button not working? Copy this link into your browser:
              </p>
              <p style="margin:0 0 32px;font-size:11px;color:#aaa;word-break:break-all;line-height:1.5;">
                ${magicLink}
              </p>

              <!-- Security note -->
              <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;border-top:1px solid #eee;padding-top:24px;">
                If you did not request this email, you can safely ignore it.
                No account will be created and no action is required.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f7f4;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:11px;color:#bbb;">
                Campaign Tracker &mdash; built for Dungeon Masters
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
