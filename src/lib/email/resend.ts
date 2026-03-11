import { Resend } from "resend";

let client: Resend | null = null;

function getResend(): Resend {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  client = new Resend(key);
  return client;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = process.env.RESEND_FROM_ADDRESS ?? "noreply@example.com";
  const resend = getResend();
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}
