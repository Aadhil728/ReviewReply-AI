import "server-only";
import nodemailer from "nodemailer";
import { getEmailConfiguration } from "@/lib/settings";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ] ?? character,
  );
}

async function transporter() {
  const configuration = await getEmailConfiguration();
  return {
    configuration,
    transport: nodemailer.createTransport({
      host: configuration.host,
      port: configuration.port,
      secure: configuration.secure,
      auth: { user: configuration.user, pass: configuration.password },
    }),
  };
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const { configuration, transport } = await transporter();
  await transport.sendMail({
    from: { name: configuration.fromName, address: configuration.fromAddress },
    ...input,
  });
}

export async function testEmailConnection(to: string) {
  const { configuration, transport } = await transporter();
  await transport.verify();
  await transport.sendMail({
    from: { name: configuration.fromName, address: configuration.fromAddress },
    to,
    subject: "ReviewReply AI email test",
    text: "Your ReviewReply AI SMTP configuration is working.",
    html: "<p>Your <strong>ReviewReply AI</strong> SMTP configuration is working.</p>",
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string;
  url: string;
}) {
  const safeName = escapeHtml(input.name);
  const safeUrl = escapeHtml(input.url);
  await sendEmail({
    to: input.email,
    subject: "Reset your password",
    text: `Hello ${input.name},\n\nReset your password using this link: ${input.url}\n\nThis link expires in one hour. If you did not request it, ignore this email.`,
    html: `<p>Hello ${safeName},</p><p>Use the secure link below to reset your password. It expires in one hour.</p><p><a href="${safeUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}
