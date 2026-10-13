import nodemailer from "nodemailer";

/**
 * Pengiriman email sungguhan lewat SMTP. Tidak ada outbox di memori.
 * Jika SMTP belum diatur: di produksi -> error; di dev -> isi email dicetak ke log server.
 */
export async function sendMail(msg: { to: string; subject: string; text: string }): Promise<void> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP_HOST belum diatur");
    console.warn(`[mail:dev] SMTP belum diatur — email TIDAK terkirim.\nKe: ${msg.to}\nSubjek: ${msg.subject}\n\n${msg.text}`);
    return;
  }
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({ from: process.env.SMTP_FROM, ...msg });
}
