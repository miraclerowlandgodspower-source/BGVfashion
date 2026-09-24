const SENDERS = {
  noreply: "BGV Fashion <noreply@bgvfashion.shop>",
  support: "BGV Support <support@bgvfashion.shop>",
  orders: "BGV Orders <orders@bgvfashion.shop>",
  marketing: "BGV Fashion <marketing@bgvfashion.shop>",
} as const;

const SUPPORT_EMAIL = "support@bgvfashion.shop";

export type BgvEmailKind = "otp" | "welcome" | "cart_reminder" | "inactive" | "brand_story";

type SenderKey = keyof typeof SENDERS;

type SendEmailInput = {
  to: string | string[];
  subject: string;
  preheader: string;
  html: string;
  text: string;
  sender: SenderKey;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://bgvfashion.shop").replace(/\/$/, "");
}

function button(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:linear-gradient(135deg,#d6b35f,#b88a31);color:#160d12;text-decoration:none;padding:15px 24px;border-radius:10px;font-weight:900;letter-spacing:.04em;box-shadow:0 8px 22px rgba(184,138,49,.24)">${escapeHtml(label)} →</a>`;
}

function layout(title: string, preheader: string, content: string, eyebrow = "BGV / PRIVATE EDIT"): string {
  const siteUrl = getSiteUrl();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;background:#090809;color:#f7f1e7;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#090809;padding:30px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#120d11;border:1px solid #34251d;border-radius:26px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.42)">
        <tr>
          <td style="padding:34px 30px 30px;background:linear-gradient(145deg,#050505 0%,#170b12 62%,#2b101f 100%);border-bottom:1px solid #4a3828">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
              <td>
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:46px;font-weight:700;letter-spacing:-6px;color:#fff9ed;line-height:1">BG<span style="color:#d4ad57">V</span></div>
                <div style="margin-top:10px;color:#d4ad57;font-size:10px;letter-spacing:3.2px;text-transform:uppercase;font-weight:800">Fashion · Lagos</div>
              </td>
              <td align="right" valign="top"><div style="display:inline-block;border:1px solid #80632e;border-radius:999px;padding:7px 10px;color:#d4ad57;font-size:9px;letter-spacing:1.6px;font-weight:800">BGV AUTHENTIC</div></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:34px 30px 36px;background:linear-gradient(180deg,#151014 0%,#100c0f 100%)">
            <div style="margin-bottom:18px;color:#a99687;font-size:10px;letter-spacing:2.8px;text-transform:uppercase;font-weight:800">${escapeHtml(eyebrow)}</div>
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 30px;background:#0a0809;border-top:1px solid #34251d;color:#958a82;font-size:11px;line-height:1.8">
            <div style="color:#d4ad57;font-weight:800;letter-spacing:1.5px;margin-bottom:5px">BGV FASHION</div>
            Need help? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#f3dfad;text-decoration:none">${SUPPORT_EMAIL}</a>.
            <br />BGV Fashion · Lagos, Nigeria
            <br /><a href="${escapeHtml(siteUrl)}" style="color:#d4ad57;font-weight:700;text-decoration:none">bgvfashion.shop</a>
          </td>
        </tr>
      </table>
      <div style="max-width:600px;padding:16px 10px;color:#625a57;font-size:10px;line-height:1.6;text-align:center">Official communication from BGV Fashion. Never share verification codes or passwords with anyone.</div>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiKey) {
    console.warn("BGV email not sent: EMAIL_API_KEY is not configured.");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SENDERS[input.sender],
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: SUPPORT_EMAIL,
    }),
  });

  if (!response.ok) {
    console.error("BGV email provider rejected message:", await response.text().catch(() => "unknown error"));
    return false;
  }
  return true;
}

export async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  const preheader = "Your secure BGV verification code. Expires in 10 minutes.";
  const html = layout(
    "Your BGV verification code",
    preheader,
    `<h1 style="margin:0 0 14px;color:#fff9ed;font-size:32px;line-height:1.1;letter-spacing:-.8px">Verify your access.</h1>
     <p style="margin:0 0 24px;color:#bcb0a8;font-size:15px;line-height:1.75">Use the one-time code below to continue securely. It expires in <strong style="color:#f3dfad">10 minutes</strong>.</p>
     <div style="background:#080708;border:1px solid #6e542b;border-radius:16px;padding:25px 14px;text-align:center;margin:22px 0 20px">
       <div style="font-size:38px;letter-spacing:11px;font-weight:900;color:#f1d38d">${escapeHtml(code)}</div>
     </div>
     <p style="margin:0;color:#827873;font-size:12px;line-height:1.7">If you did not request this code, ignore this message. BGV will never ask you to send this code to another person.</p>`,
    "SECURE ACCESS / ONE-TIME CODE"
  );
  return sendEmail({
    to: email,
    sender: "noreply",
    subject: `${code} · Your BGV verification code`,
    preheader,
    html,
    text: `Your BGV Fashion verification code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`,
  });
}

export async function sendWelcomeEmail(email: string, name?: string | null): Promise<boolean> {
  const firstName = (name || "there").trim().split(/\s+/)[0] || "there";
  const siteUrl = getSiteUrl();
  const preheader = "Welcome to BGV Fashion. Your private edit starts here.";
  const html = layout(
    "Welcome to BGV Fashion",
    preheader,
    `<h1 style="margin:0 0 14px;color:#fff9ed;font-size:34px;line-height:1.08;letter-spacing:-1px">Welcome to BGV,<br/>${escapeHtml(firstName)}.</h1>
     <p style="margin:0 0 18px;color:#bcb0a8;font-size:15px;line-height:1.75">Your BGV account is your access point to curated fashion, saved pieces, secure checkout and verified order tracking.</p>
     <div style="margin:24px 0;padding:18px;border-left:2px solid #d4ad57;background:#0b090a;color:#d9cec5;font-size:13px;line-height:1.7">Designed in Lagos. Built for a sharper, more personal way to shop.</div>
     ${button("Enter the collection", siteUrl + "/shop")}`,
    "WELCOME / BGV MEMBER ACCESS"
  );
  return sendEmail({
    to: email,
    sender: "noreply",
    subject: "Welcome to BGV · Your access starts here",
    preheader,
    html,
    text: `Welcome to BGV Fashion, ${firstName}. Explore the collection at ${siteUrl}/shop`,
  });
}

export async function sendCartReminderEmail(email: string, name?: string | null, itemCount = 1): Promise<boolean> {
  const siteUrl = getSiteUrl();
  const firstName = (name || "there").trim().split(/\s+/)[0] || "there";
  const preheader = "Your selected BGV pieces are still in your bag.";
  const html = layout(
    "Your BGV bag is waiting",
    preheader,
    `<h1 style="margin:0 0 14px;color:#fff9ed;font-size:34px;line-height:1.08;letter-spacing:-1px">Still thinking about it,<br/>${escapeHtml(firstName)}?</h1>
     <p style="margin:0 0 24px;color:#bcb0a8;font-size:15px;line-height:1.75">You left <strong style="color:#f3dfad">${escapeHtml(itemCount)} item${itemCount === 1 ? "" : "s"}</strong> in your BGV bag. Your edit is waiting whenever you are ready.</p>
     ${button("Return to your bag", siteUrl + "/cart")}`,
    "YOUR EDIT / BAG REMINDER"
  );
  return sendEmail({
    to: email,
    sender: "marketing",
    subject: "Your BGV edit is still waiting",
    preheader,
    html,
    text: `You still have ${itemCount} item${itemCount === 1 ? "" : "s"} in your BGV bag: ${siteUrl}/cart`,
  });
}

export async function sendInactiveUserEmail(email: string, name?: string | null): Promise<boolean> {
  const siteUrl = getSiteUrl();
  const firstName = (name || "there").trim().split(/\s+/)[0] || "there";
  const preheader = "A new BGV edit may have landed since your last visit.";
  const html = layout(
    "See what changed at BGV",
    preheader,
    `<h1 style="margin:0 0 14px;color:#fff9ed;font-size:34px;line-height:1.08;letter-spacing:-1px">${escapeHtml(firstName)}, the edit moved on.</h1>
     <p style="margin:0 0 24px;color:#bcb0a8;font-size:15px;line-height:1.75">It has been a little while. Step back into BGV and discover the latest pieces, refined collections and new drops waiting for you.</p>
     ${button("See what is new", siteUrl + "/shop")}`,
    "NEW ENERGY / RETURN TO BGV"
  );
  return sendEmail({
    to: email,
    sender: "marketing",
    subject: "A fresh BGV edit is waiting",
    preheader,
    html,
    text: `See what is new at BGV Fashion: ${siteUrl}/shop`,
  });
}

export async function sendBrandStoryEmail(email: string, name?: string | null): Promise<boolean> {
  const siteUrl = getSiteUrl();
  const firstName = (name || "there").trim().split(/\s+/)[0] || "there";
  const preheader = "Inside BGV: modern fashion energy built from Lagos.";
  const html = layout(
    "Inside BGV Fashion",
    preheader,
    `<h1 style="margin:0 0 14px;color:#fff9ed;font-size:34px;line-height:1.08;letter-spacing:-1px">${escapeHtml(firstName)}, this is BGV.</h1>
     <p style="margin:0 0 18px;color:#bcb0a8;font-size:15px;line-height:1.75">BGV Fashion is built around a simple idea: shopping should feel intentional, premium and personal.</p>
     <p style="margin:0 0 26px;color:#bcb0a8;font-size:15px;line-height:1.75">From the collection to checkout, tracking and support, every detail is designed to feel unmistakably BGV.</p>
     ${button("Discover BGV", siteUrl + "/shop")}`,
    "THE HOUSE / BGV FASHION"
  );
  return sendEmail({
    to: email,
    sender: "marketing",
    subject: "Inside BGV · The story behind the edit",
    preheader,
    html,
    text: `Discover BGV Fashion: ${siteUrl}/shop`,
  });
}
