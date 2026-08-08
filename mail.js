// The magic-link email, via Resend. One function, one job.
import { Resend } from "resend";

export async function sendLoginLink(email, link){
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: `String & Racket Finder <${process.env.MAIL_FROM}>`,
    to: email,
    subject: "Your sign-in link",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:460px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 8px;">String &amp; Racket Finder</h2>
        <p>Click to sign in — the link works once and expires in 15 minutes.</p>
        <p style="margin:22px 0;">
          <a href="${link}" style="background:#1F5233;color:#DFEDE2;padding:12px 22px;
             border-radius:9px;text-decoration:none;font-weight:600;">Sign me in</a>
        </p>
        <p style="color:#777;font-size:12px;">If you didn't request this, ignore it — nothing happens without the click.</p>
      </div>`
  });
  if (error) throw new Error("mail failed: " + JSON.stringify(error));
}
