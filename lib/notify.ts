import "server-only"

import nodemailer, { type Transporter } from "nodemailer"
import { formatPrice, SITE_NAME } from "@/lib/constants"
import { summariseBranding } from "@/lib/branding"
import type { StoredOrder, StoredQuote } from "@/lib/records"
import { findUpload, readUploadFile } from "@/lib/uploads"

/**
 * Email alerts for new quotes and orders.
 *
 * Settings (.env):
 *   SMTP_HOST, SMTP_PORT (465 = SSL, 587 = STARTTLS), SMTP_USER, SMTP_PASSWORD
 *   MAIL_FROM       sender, e.g. "Lenor <noreply@lenor.co.za>"
 *   NOTIFY_EMAILS   Lenor staff who get alerts (comma separated);
 *                   falls back to ADMIN_EMAILS
 *
 * Email never blocks a quote or order: if sending fails, the record is
 * still saved and the error is logged.
 */

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim()
  if (!host) return null

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587)
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" }
        : undefined,
    })
  }
  return transporter
}

function sender(): string {
  return process.env.MAIL_FROM?.trim() || `${SITE_NAME} <noreply@lenor.co.za>`
}

function staffEmails(): string[] {
  const list = process.env.NOTIFY_EMAILS?.trim() || process.env.ADMIN_EMAILS || ""
  return list.split(",").map((e) => e.trim()).filter(Boolean)
}

function siteUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")
  return base ? `${base}${path}` : path
}

const escape = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  )

/** One-line header values must not contain line breaks. */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").slice(0, 200)

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b">
<div style="max-width:640px;margin:0 auto;padding:24px">
<div style="background:#111827;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;font-size:18px;font-weight:bold">${escape(SITE_NAME)}</div>
<div style="background:#fff;padding:20px;border-radius:0 0 8px 8px">
<h1 style="font-size:18px;margin:0 0 16px">${escape(title)}</h1>
${body}
</div></div></body></html>`
}

function table(headers: string[], rows: string[][]): string {
  const th = headers
    .map((h) => `<th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e4e4e7;font-size:12px">${escape(h)}</th>`)
    .join("")
  const tr = rows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td style="padding:6px 8px;border-bottom:1px solid #f4f4f5;font-size:13px;vertical-align:top">${c}</td>`).join("")}</tr>`,
    )
    .join("")
  return `<table style="width:100%;border-collapse:collapse;margin:8px 0 16px">${th ? `<tr>${th}</tr>` : ""}${tr}</table>`
}

function details(pairs: [string, string | undefined | null][]): string {
  return table(
    [],
    pairs
      .filter(([, v]) => v)
      .map(([k, v]) => [`<strong>${escape(k)}</strong>`, escape(v)]),
  )
}

async function send(message: nodemailer.SendMailOptions, label: string) {
  const transport = getTransporter()
  if (!transport) {
    console.log(`Lenor: email not configured (SMTP_HOST empty), skipped: ${label}`)
    return
  }
  try {
    await transport.sendMail({ from: sender(), ...message })
    console.log(`Lenor: email sent: ${label}`)
  } catch (error) {
    console.error(`Lenor: email failed: ${label}:`, error)
  }
}

/* ------------------------------------------------------------------ */
/*  Quotes                                                             */
/* ------------------------------------------------------------------ */

function quoteItemRows(quote: StoredQuote): string[][] {
  return quote.items.map((item) => [
    `${escape(item.productName)}<br><span style="color:#71717a">${escape(item.sku)}</span>`,
    `${escape(item.color)} / ${escape(item.size)}`,
    escape(item.quantity),
    escape(
      item.brandings && item.brandings.length > 0
        ? summariseBranding(item.brandings)
        : item.brandingPosition || "Unbranded",
    ) + (item.brandingNotes ? `<br><em>${escape(item.brandingNotes)}</em>` : ""),
  ])
}

export async function notifyNewQuote(quote: StoredQuote): Promise<void> {
  const staff = staffEmails()
  const rows = quoteItemRows(quote)
  const headers = ["Product", "Colour / Size", "Qty", "Branding"]

  const attachments: nodemailer.SendMailOptions["attachments"] = []
  if (quote.logoFileId) {
    const upload = await findUpload(quote.logoFileId)
    if (upload && upload.size <= 10 * 1024 * 1024) {
      try {
        attachments.push({
          filename: upload.fileName,
          content: await readUploadFile(upload),
          contentType: upload.contentType,
        })
      } catch (error) {
        console.error("Lenor: could not attach logo:", error)
      }
    }
  }

  const tasks: Promise<void>[] = []

  if (staff.length > 0) {
    tasks.push(
      send(
        {
          to: staff,
          replyTo: quote.contactEmail,
          subject: oneLine(`New quote request ${quote.quoteNumber} from ${quote.companyName}`),
          html: layout(
            `New quote request ${quote.quoteNumber}`,
            details([
              ["Company", quote.companyName],
              ["Contact", quote.contactName],
              ["Email", quote.contactEmail],
              ["Needed by", quote.deadline],
              ["Logo", quote.logoFileName ?? (quote.logoFileId ? "Uploaded" : "None")],
              ["Instructions", quote.specialInstructions],
            ]) +
              table(headers, rows) +
              `<p><a href="${escape(siteUrl(`/orders/${quote.id}`))}">Open the quote on the website</a> (sign in as a Lenor admin).</p>` +
              `<p style="color:#71717a;font-size:12px">Reply to this email to answer the customer directly.</p>`,
          ),
          attachments,
        },
        `staff alert for ${quote.quoteNumber}`,
      ),
    )
  } else {
    console.warn("Lenor: no NOTIFY_EMAILS or ADMIN_EMAILS set, staff not alerted")
  }

  tasks.push(
    send(
      {
        to: quote.contactEmail,
        subject: oneLine(`We received your quote request ${quote.quoteNumber}`),
        html: layout(
          "Thank you for your quote request",
          `<p>Hi ${escape(quote.contactName)},</p>
<p>We've received your quote request <strong>${escape(quote.quoteNumber)}</strong>. Our team will check your branding requirements and send you a formal quotation.</p>` +
            table(headers, rows) +
            `<p style="color:#71717a;font-size:12px">This is an automatic message from noreply. Please don't reply to it.</p>`,
        ),
      },
      `customer confirmation for ${quote.quoteNumber}`,
    ),
  )

  await Promise.all(tasks)
}

/* ------------------------------------------------------------------ */
/*  Orders                                                             */
/* ------------------------------------------------------------------ */

function orderItemRows(order: StoredOrder): string[][] {
  return order.items.map((item) => [
    `${escape(item.productName)}<br><span style="color:#71717a">${escape(item.sku)}</span>`,
    `${escape(item.color)} / ${escape(item.size)}`,
    escape(item.quantity),
    escape(formatPrice(item.unitPrice)),
    escape(formatPrice(item.unitPrice * item.quantity)),
  ])
}

function totals(order: StoredOrder): string {
  return table(
    [],
    [
      ["Subtotal (excl. VAT)", escape(formatPrice(order.subtotal))],
      ["VAT (15%)", escape(formatPrice(order.vat))],
      ["<strong>Total</strong>", `<strong>${escape(formatPrice(order.total))}</strong>`],
    ],
  )
}

export async function notifyNewOrder(order: StoredOrder): Promise<void> {
  const staff = staffEmails()
  const headers = ["Product", "Colour / Size", "Qty", "Unit", "Line"]
  const rows = orderItemRows(order)
  const tasks: Promise<void>[] = []

  if (staff.length > 0) {
    tasks.push(
      send(
        {
          to: staff,
          replyTo: order.contactEmail,
          subject: oneLine(`New order ${order.orderNumber} (${formatPrice(order.total)})`),
          html: layout(
            `New order ${order.orderNumber}`,
            details([
              ["Contact", order.contactName],
              ["Email", order.contactEmail],
              ["Phone", order.contactPhone],
              ["Billing address", order.billingAddress],
              ["Shipping address", order.shippingAddress],
            ]) +
              table(headers, rows) +
              totals(order) +
              `<p>No payment has been taken. Confirm stock with Amrod and send the customer an invoice.</p>` +
              `<p><a href="${escape(siteUrl(`/orders/${order.id}`))}">Open the order on the website</a></p>`,
          ),
        },
        `staff alert for ${order.orderNumber}`,
      ),
    )
  }

  tasks.push(
    send(
      {
        to: order.contactEmail,
        subject: oneLine(`We received your order ${order.orderNumber}`),
        html: layout(
          "Thank you for your order",
          `<p>Hi ${escape(order.contactName)},</p>
<p>We've received your order <strong>${escape(order.orderNumber)}</strong>. Lenor will confirm stock and send you an invoice with payment details.</p>` +
            table(headers, rows) +
            totals(order) +
            `<p style="color:#71717a;font-size:12px">This is an automatic message from noreply. Please don't reply to it.</p>`,
        ),
      },
      `customer confirmation for ${order.orderNumber}`,
    ),
  )

  await Promise.all(tasks)
}
