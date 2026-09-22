import { Order, OrderItem } from "@/types";
import { formatMoney } from "@/lib/money";

const DEFAULT_FROM = "admin@bgvfashion.shop";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

function addressText(address: Order["shippingAddress"]): string {
  return [address.addressLine, address.city, address.state, address.country, address.postalCode]
    .filter(Boolean)
    .map(escapeHtml)
    .join(", ");
}

function receiptHtml(order: Order, items: OrderItem[], transactionId?: string | null): string {
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e6e1d8">${escapeHtml(item.productName)}<br><small>Size: ${escapeHtml(item.size)} · Colour: ${escapeHtml(item.colour || "As selected")}</small></td>
      <td style="padding:12px 0;border-bottom:1px solid #e6e1d8;text-align:center">${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #e6e1d8;text-align:right">${escapeHtml(formatMoney(item.totalPrice, order.currency))}</td>
    </tr>`).join("");
  const tracking = order.trackingUrl
    ? `<a href="${escapeHtml(order.trackingUrl)}">${escapeHtml(order.trackingNumber || "Track shipment")}</a>`
    : escapeHtml(order.trackingNumber || "Not assigned yet");
  const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track-order?query=${encodeURIComponent(order.orderNumber)}`;

  return `<!doctype html><html><body style="margin:0;background:#f7f6f2;color:#151515;font-family:Arial,sans-serif"><div style="max-width:680px;margin:0 auto;padding:36px 22px"><div style="background:#111;color:#fff;padding:28px"><div style="font-size:28px;font-weight:900;letter-spacing:-2px">BGV</div><div style="color:#c6a766;font-size:11px;letter-spacing:2px;margin-top:8px">ORDER CONFIRMATION</div></div><div style="background:#fff;padding:30px"><h1 style="font-size:26px;margin:0 0 12px">Thank you, ${escapeHtml(order.customerName)}.</h1><p style="color:#666">Your payment has been verified and your BGV order is now confirmed.</p><table style="width:100%;border-collapse:collapse;margin:24px 0"><tr><td>Order number</td><td style="text-align:right"><strong>${escapeHtml(order.orderNumber)}</strong></td></tr><tr><td>Order date</td><td style="text-align:right">${escapeHtml(new Date(order.createdAt).toLocaleString())}</td></tr><tr><td>Payment status</td><td style="text-align:right">${escapeHtml(order.paymentStatus || "paid")}</td></tr><tr><td>Payment reference</td><td style="text-align:right">${escapeHtml(order.paystackReference)}</td></tr><tr><td>Transaction ID</td><td style="text-align:right">${escapeHtml(transactionId || order.paystackTransactionId || "Available in payment record")}</td></tr></table><h2 style="font-size:16px">Items</h2><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Piece</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>${itemRows}</tbody></table><table style="width:100%;border-collapse:collapse;margin-top:18px"><tr><td>Subtotal</td><td style="text-align:right">${escapeHtml(formatMoney(order.subtotal, order.currency))}</td></tr><tr><td>Delivery fee</td><td style="text-align:right">${escapeHtml(formatMoney(order.shippingFee, order.currency))}</td></tr><tr><td>VAT (7% of delivery)</td><td style="text-align:right">${escapeHtml(formatMoney(order.taxFee, order.currency))}</td></tr><tr><td style="padding-top:12px;font-size:18px"><strong>Total</strong></td><td style="padding-top:12px;text-align:right;font-size:18px"><strong>${escapeHtml(formatMoney(order.totalAmount, order.currency))}</strong></td></tr></table><h2 style="font-size:16px;margin-top:28px">Delivery</h2><p>${addressText(order.shippingAddress)}</p><p>Shipping status: <strong>${escapeHtml(order.trackingStatus || order.status)}</strong><br>Estimated delivery: ${escapeHtml(order.estimatedDelivery || "To be confirmed")}<br>Tracking: ${tracking}</p><p style="margin-top:28px"><a href="${escapeHtml(trackUrl)}" style="display:inline-block;background:#c6a766;color:#111;padding:13px 18px;text-decoration:none;font-weight:bold">Track order</a></p></div><p style="color:#777;font-size:12px;padding:18px 0">Questions? Contact concierge@bgvfashion.com. BGV Fashion, Ojo, Lagos.</p></div></body></html>`;
}

export async function sendOrderReceiptEmails(order: Order, items: OrderItem[], transactionId?: string | null): Promise<boolean> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!apiKey || !adminEmail) {
    console.warn("Receipt email not sent: EMAIL_API_KEY or ADMIN_NOTIFICATION_EMAIL is not configured.");
    return false;
  }

  const html = receiptHtml(order, items, transactionId);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [order.customerEmail],
      cc: [adminEmail],
      subject: `BGV order confirmed · ${order.orderNumber}`,
      html,
    }),
  });

  if (!response.ok) {
    console.error("Receipt email provider rejected the order receipt:", await response.text().catch(() => "unknown error"));
    return false;
  }
  return true;
}
