import { Order, OrderItem } from "@/types";
import { formatMoney } from "@/lib/money";

const ORDER_FROM = "BGV Orders <orders@bgvfashion.shop>";
const SUPPORT_EMAIL = "support@bgvfashion.shop";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] || character);
}

function addressText(address: Order["shippingAddress"]): string {
  return [address.addressLine, address.city, address.state, address.country, address.postalCode]
    .filter(Boolean).map(escapeHtml).join(", ");
}

function receiptHtml(order: Order, items: OrderItem[], transactionId?: string | null): string {
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:15px 0;border-bottom:1px solid #30272b;color:#f6efe6">${escapeHtml(item.productName)}<br><small style="color:#91868b">Size: ${escapeHtml(item.size)} · Colour: ${escapeHtml(item.colour || "As selected")}</small></td>
      <td style="padding:15px 0;border-bottom:1px solid #30272b;text-align:center;color:#c5babf">${item.quantity}</td>
      <td style="padding:15px 0;border-bottom:1px solid #30272b;text-align:right;color:#f0d18a;font-weight:700">${escapeHtml(formatMoney(item.totalPrice, order.currency))}</td>
    </tr>`).join("");

  const tracking = order.trackingUrl
    ? `<a href="${escapeHtml(order.trackingUrl)}" style="color:#f0d18a">${escapeHtml(order.trackingNumber || "Track shipment")}</a>`
    : escapeHtml(order.trackingNumber || "Not assigned yet");
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://bgvfashion.shop").replace(/\/$/, "");
  const trackUrl = `${siteUrl}/track-order?query=${encodeURIComponent(order.orderNumber)}`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BGV Order Confirmation</title></head>
<body style="margin:0;background:#090809;color:#f7f1e7;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Payment verified. Your BGV order ${escapeHtml(order.orderNumber)} is confirmed.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090809;padding:30px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#120d11;border:1px solid #34251d;border-radius:26px;overflow:hidden">
<tr><td style="padding:34px 30px;background:linear-gradient(145deg,#050505,#170b12 62%,#2b101f);border-bottom:1px solid #4a3828">
  <table role="presentation" width="100%"><tr><td><div style="font-family:Georgia,'Times New Roman',serif;font-size:46px;font-weight:700;letter-spacing:-6px;color:#fff9ed">BG<span style="color:#d4ad57">V</span></div><div style="margin-top:9px;color:#d4ad57;font-size:10px;letter-spacing:3px;font-weight:800">ORDER / CONFIRMED</div></td><td align="right"><div style="border:1px solid #80632e;border-radius:999px;padding:7px 10px;color:#d4ad57;font-size:9px;letter-spacing:1.5px;font-weight:800;display:inline-block">PAYMENT VERIFIED</div></td></tr></table>
</td></tr>
<tr><td style="padding:34px 30px;background:linear-gradient(180deg,#151014,#100c0f)">
  <div style="color:#a99687;font-size:10px;letter-spacing:2.6px;font-weight:800;margin-bottom:16px">YOUR BGV ORDER</div>
  <h1 style="font-size:32px;line-height:1.1;margin:0 0 12px;color:#fff9ed">Thank you, ${escapeHtml(order.customerName)}.</h1>
  <p style="color:#bcb0a8;line-height:1.7;margin:0 0 26px">Your payment has been verified and your BGV order is confirmed. We will keep you updated as it moves toward delivery.</p>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090809;border:1px solid #34251d;padding:16px;margin-bottom:28px">
    <tr><td style="padding:6px;color:#91868b">Order</td><td style="padding:6px;text-align:right;color:#f0d18a;font-weight:800">${escapeHtml(order.orderNumber)}</td></tr>
    <tr><td style="padding:6px;color:#91868b">Date</td><td style="padding:6px;text-align:right;color:#d7ced1">${escapeHtml(new Date(order.createdAt).toLocaleString())}</td></tr>
    <tr><td style="padding:6px;color:#91868b">Payment</td><td style="padding:6px;text-align:right;color:#d7ced1">${escapeHtml(order.paymentStatus || "paid")}</td></tr>
    <tr><td style="padding:6px;color:#91868b">Reference</td><td style="padding:6px;text-align:right;color:#d7ced1">${escapeHtml(order.paystackReference)}</td></tr>
    <tr><td style="padding:6px;color:#91868b">Transaction</td><td style="padding:6px;text-align:right;color:#d7ced1">${escapeHtml(transactionId || order.paystackTransactionId || "Available in payment record")}</td></tr>
  </table>

  <div style="color:#d4ad57;font-size:11px;letter-spacing:2px;font-weight:800;margin-bottom:8px">YOUR PIECES</div>
  <table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:10px 0;text-align:left;color:#91868b;font-size:11px">PIECE</th><th style="color:#91868b;font-size:11px">QTY</th><th style="text-align:right;color:#91868b;font-size:11px">AMOUNT</th></tr></thead><tbody>${itemRows}</tbody></table>

  <table style="width:100%;border-collapse:collapse;margin-top:20px;color:#bcb0a8">
    <tr><td style="padding:5px 0">Subtotal</td><td style="text-align:right">${escapeHtml(formatMoney(order.subtotal, order.currency))}</td></tr>
    <tr><td style="padding:5px 0">Delivery</td><td style="text-align:right">${escapeHtml(formatMoney(order.shippingFee, order.currency))}</td></tr>
    <tr><td style="padding:5px 0">VAT (7% of delivery)</td><td style="text-align:right">${escapeHtml(formatMoney(order.taxFee, order.currency))}</td></tr>
    <tr><td style="padding-top:15px;font-size:18px;color:#fff9ed"><strong>Total</strong></td><td style="padding-top:15px;text-align:right;font-size:20px;color:#f0d18a"><strong>${escapeHtml(formatMoney(order.totalAmount, order.currency))}</strong></td></tr>
  </table>

  <div style="margin-top:30px;padding:20px;background:#090809;border-left:2px solid #d4ad57">
    <div style="color:#d4ad57;font-size:11px;letter-spacing:2px;font-weight:800;margin-bottom:10px">DELIVERY</div>
    <p style="color:#c5babf;line-height:1.7;margin:0 0 8px">${addressText(order.shippingAddress)}</p>
    <p style="color:#91868b;line-height:1.7;margin:0">Status: <strong style="color:#f6efe6">${escapeHtml(order.trackingStatus || order.status)}</strong><br>Estimated delivery: ${escapeHtml(order.estimatedDelivery || "To be confirmed")}<br>Tracking: ${tracking}</p>
  </div>
  <p style="margin:28px 0 0"><a href="${escapeHtml(trackUrl)}" style="display:inline-block;background:linear-gradient(135deg,#d6b35f,#b88a31);color:#160d12;padding:15px 24px;text-decoration:none;font-size:12px;font-weight:900;letter-spacing:.05em;border-radius:10px">TRACK YOUR ORDER →</a></p>
</td></tr>
<tr><td style="padding:24px 30px;background:#0a0809;border-top:1px solid #34251d;color:#958a82;font-size:11px;line-height:1.8"><div style="color:#d4ad57;font-weight:800;letter-spacing:1.5px;margin-bottom:5px">BGV FASHION</div>Questions about your order? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#f3dfad;text-decoration:none">${SUPPORT_EMAIL}</a>.<br>Official order email from <strong style="color:#d8d0d3">orders@bgvfashion.shop</strong> · Lagos, Nigeria</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendOrderReceiptEmails(order: Order, items: OrderItem[], transactionId?: string | null): Promise<boolean> {
  const apiKey = process.env.EMAIL_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@bgvfashion.shop";
  if (!apiKey) {
    console.warn("Receipt email not sent: EMAIL_API_KEY is not configured.");
    return false;
  }

  const html = receiptHtml(order, items, transactionId);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ORDER_FROM,
      to: [order.customerEmail],
      cc: [adminEmail],
      reply_to: SUPPORT_EMAIL,
      subject: `BGV order confirmed · ${order.orderNumber}`,
      html,
      text: `Your BGV order ${order.orderNumber} is confirmed. Payment has been verified. Track your order at ${process.env.NEXT_PUBLIC_APP_URL || "https://bgvfashion.shop"}/track-order?query=${encodeURIComponent(order.orderNumber)}. Need help? ${SUPPORT_EMAIL}`,
    }),
  });

  if (!response.ok) {
    console.error("Receipt email provider rejected the order receipt:", await response.text().catch(() => "unknown error"));
    return false;
  }
  return true;
}
