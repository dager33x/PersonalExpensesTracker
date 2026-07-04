import nodemailer from "nodemailer";
import { EMAIL, PASSWORD, SMTP_PORT, SMTP_SERVER } from "../config/env.js";

const smtpPort = Number(SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: SMTP_SERVER,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: EMAIL,
    pass: PASSWORD,
  },
});

export async function sendMail({ to, subject, text, html }) {
  if (!SMTP_SERVER || !EMAIL || !PASSWORD) {
    throw new Error("SMTP is not configured.");
  }

  return transporter.sendMail({
    from: EMAIL,
    to,
    subject,
    text,
    html,
  });
}


transporter.verify((error, success) => {
    if (error) {
        console.log("SMTP Error:", error);
    } else {
        console.log("SMTP Server is ready");
    }
});

