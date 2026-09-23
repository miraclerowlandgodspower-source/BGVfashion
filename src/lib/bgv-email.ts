const DEFAULT_FROM = "admin@bgvfashion.shop";

export type BgvEmailKind = "otp" | "welcome" | "cart_reminder" | "inactive" | "brand_story";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  preheader: string;
  html: string;
  text: string;
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

function getFromAddress(): string {
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  return from.includes("<") ? from : `BGV Fashion <${from}>`;
}

function button(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#40152f;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:800;letter-spacing:.02em">${escapeHtml(label)}</a>`;
}

function layout(title: string, preheader: string, content: string): string {
  const siteUrl = getSiteUrl();
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f7f4f1;color:#201822;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4f1;padding:28px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #eadfda;box-shadow:0 18px 50px rgba(32,24,34,.08)">
            <tr>
              <td style="background:linear-gradient(135deg,#271020,#40152f);padding:30px 28px;color:#ffffff">
                <div style="font-size:34px;font-weight:900;letter-spacing:-2px;line-height:1">BGV</div>
                <div style="margin-top:8px;color:#d7b56d;font-size:12px;letter-spacing:2.4px;text-transform:uppercase;font-weight:800">Fashion Atelier</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px;background:#fbfaf8;border-top:1px solid #eadfda;color:#766b72;font-size:12px;line-height:1.7">
                You are receiving this email because you created an account, started checkout, or asked to hear from BGV Fashion. We keep our emails useful and limited.
                <br />
                BGV Fashion, Ojo, Lagos. Sent from <strong>admin@bgvfashion.shop</strong>.
                <br />
                <a href="${escapeHtml(siteUrl)}" style="color:#40152f;font-weight:700;text-decoration:none">Visit BGV Fashion</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
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
      from: getFromAddress(),
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_FROM,
    }),
  });

  if (!response.ok) {
    console.error("BGV email provider rejected message:", await response.text().catch(() => "unknown error"));
    return false;
  }

  return true;
}

export async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  const preheader = "Use this secure 6-digit code to verify your BGV Fashion email address.";
  const html = layout(
    "Your BGV verification code",
    preheader,
    `<p style="margin:0 0 10px;color:#7b6f76;font-size:13px;letter-spacing:1.8px;text-transform:uppercase;font-weight:800">Secure verification</p>
     <h1 style="margin:0 0 14px;color:#201822;font-size:30px;line-height:1.15">Your BGV verification code</h1>
     <p style="margin:0 0 22px;color:#5d525a;font-size:16px;line-height:1.7">Enter this code to continue. For your safety, the code expires in 10 minutes.</p>
     <div style="background:#f7f4f1;border:1px solid #e8ddd4;border-radius:18px;padding:22px;text-align:center;margin:22px 0">
       <div style="font-size:38px;letter-spacing:10px;font-weight:900;color:#40152f">${escapeHtml(code)}</div>
     </div>
     <p style="margin:0;color:#766b72;font-size:13px;line-height:1.7">If you did not request this code, you can ignore this email. Never share your verification code with anyone.</p>`
  );

  return sendEmail({
    to: email,
    subject: "Your BGV Fashion verification code",
    preheader,
    html,
    text: `Your BGV Fashion verification code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`,
  });
}

export async function sendWelcomeEmail(email: string, name?: string | null): Promise<boolean> {
  const firstName = (name || "there").trim().split(/\s+/)[0] || "there";
  const siteUrl = getSiteUrl();
  const preheader = "Welcome to BGV Fashion — premium wardrobe pieces, secure checkout, and order tracking.";
  const html = layout(
    "Welcome to BGV Fashion",
    preheader,
    `<p style="margin:0 0 10px;color:#7b6f76;font-size:13px;letter-spacing:1.8px;text-transform:uppercase;font-weight:800">Welcome to the atelier</p>
     <h1 style="margin:0 0 14px;color:#201822;font-size:30px;line-height:1.15">Welcome, ${escapeHtml(firstName)}.</h1>
     <p style="margin:0 0 18px;color:#5d525a;font-size:16px;line-height:1.7">BGV Fashion is built for a clean, premium shopping experience — refined collections, secure payment, verified order updates, and fashion pieces selected with a luxury streetwear feel.</p>
     <p style="margin:0 0 24px;color:#5d525a;font-size:16px;line-height:1.7">Your account gives you faster checkout, saved style activity, wishlist access, and tracking updates from our atelier.</p>
     ${button("Explore BGV", siteUrl + "/shop")}`
  );

  return sendEmail({
    to: email,
    subject: "Welcome to BGV Fashion",
    preheader,
    html,
    text: `Welcome to BGV Fashion, ${firstName}. Explore premium fashion, secure checkout, wishlist access, and order tracking at ${siteUrl}/shop`,
  });
}

export async function sendCartReminderEmail(email: string, name?: string | null, itemCount = 1): Promise<boolean> {
  const siteUrl = getSiteUrl();
  const firstName = (name || "there").trim().split(/\s+/)[0] || "there";
  const preheader = "You still have selected pieces waiting in your BGV bag.";
  const html = layout(
    "Your BGV bag is waiting",
    preheader,
    `<p style="margin:0 0 10px;color:#7b6f76;font-size:13px;letter-spacing:1.8px;text-transform:uppercase;font-weight:800">Shopping bag reminder</p>
     <h1 style="margin:0 0 14px;color:#201822;font-size:30px;line-height:1.15">${escapeHtml(firstName)}, your pieces are still waiting.</h1>
     <p style="margin:0 0 22px;color:#5d525a;font-size:16px;line-height:1.7">You left ${escapeHtml(itemCount)} item${itemCount === 1 ? "" : "s"} in your BGV bag. Complete checkout when you are ready — no pressure, just a reminder before styles move.</p>
     ${button("Return to bag", siteUrl + "/cart")}`
  );

  return sendEmail({
    to: email,
    subject: "Your BGV bag is waiting",
    preheader,
    html,
    text: `You still have ${itemCount} item${itemCount === 1 ? "" : "s"} in your BGV bag. Return here: ${siteUrl}/cart`,
  });
}

export async function sendInactiveUserEmail(email: string, name?: string | null): Promise<boolean> {
  const siteUrl = getSiteUrl();
  const firstName = (name || "there").trim().split(/\s+/)[0] || "there";
  const preheader = "New BGV edits may be waiting for you after two weeks away.";
  const html = layout(
    "A fresh BGV edit is waiting",
    preheader,
    `<p style="margin:0 0 10px;color:#7b6f76;font-size:13px;letter-spacing:1.8px;text-transform:uppercase;font-weight:800">Style check-in</p>
     <h1 style="margin:0 0 14px;color:#201822;font-size:30px;line-height:1.15">${escapeHtml(firstName)}, see what changed at BGV.</h1>
     <p style="margin:0 0 22px;color:#5d525a;font-size:16px;line-height:1.7">It has been a while since your last visit. BGV Fashion continues to shape a premium wardrobe experience with new edits, cleaner checkout, wishlist tools, and order tracking from our Lagos atelier.</p>
     ${button("Visit BGV", siteUrl)}`
  );

  return sendEmail({
    to: email,
    subject: "A fresh BGV edit is waiting",
    preheader,
    html,
    text: `It has been a while since your last BGV visit. Explore the latest BGV edit here: ${siteUrl}`,
  });
}

export async function sendBrandStoryEmail(email: string, name?: string | null): Promise<boolean> {
  const siteUrl = getSiteUrl();
  const firstName = (name || "there").trim().split(/\s+/)[0] || "there";
  const preheader = "BGV Fashion is a premium fashion experience built from Lagos for modern wardrobe energy.";
  const html = layout(
    "Inside BGV Fashion",
    preheader,
    `<p style="margin:0 0 10px;color:#7b6f76;font-size:13px;letter-spacing:1.8px;text-transform:uppercase;font-weight:800">Inside BGV</p>
     <h1 style="margin:0 0 14px;color:#201822;font-size:30px;line-height:1.15">${escapeHtml(firstName)}, BGV is more than a store.</h1>
     <p style="margin:0 0 18px;color:#5d525a;font-size:16px;line-height:1.7">BGV Fashion is designed to feel premium, sharp, and personal — a modern fashion destination with a luxury streetwear attitude and clean shopping flow.</p>
     <p style="margin:0 0 24px;color:#5d525a;font-size:16px;line-height:1.7">From secure payments to verified tracking and customer support, every detail is built to make shopping feel trustworthy and elevated.</p>
     ${button("View the collection", siteUrl + "/shop")}`
  );

  return sendEmail({
    to: email,
    subject: "Inside BGV Fashion",
    preheader,
    html,
    text: `BGV Fashion is a premium fashion experience built from Lagos for modern wardrobe energy. View the collection: ${siteUrl}/shop`,
  });
}
