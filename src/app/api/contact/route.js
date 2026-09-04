import nodemailer from "nodemailer";

const MAX = { name: 120, phone: 40, email: 254, message: 5000 };

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendWithTransport(options, messages) {
  const transporter = nodemailer.createTransport(options);
  for (const msg of messages) {
    await transporter.sendMail(msg);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";

  console.log(subject, 'subject of email');

  if (!name || !phone || !email || !message) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }
  if (
    name.length > MAX.name ||
    phone.length > MAX.phone ||
    email.length > MAX.email ||
    message.length > MAX.message
  ) {
    return Response.json({ error: "Some fields are too long." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.error("contact API: SMTP_USER / SMTP_PASS missing");
    return Response.json({ error: "Server email is not configured." }, { status: 500 });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || user).trim();
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = port === 465;
  const family = Number(process.env.SMTP_FAMILY) || 4;
  const rejectUnauthorized =
    process.env.SMTP_TLS_REJECT_UNAUTHORIZED?.toLowerCase() !== "false";
  const tls = { servername: host, rejectUnauthorized };

  const safe = {
    name: escapeHtml(name),
    phone: escapeHtml(phone),
    email: escapeHtml(email),
    message: escapeHtml(message).replace(/\n/g, "<br/>"),
    subject: escapeHtml(subject),
  };

  const adminText = [
    "New Contact Us form submission",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const adminHtml = `
  <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(90deg,#D70007 0%,#a00006 50%,#610105 100%);padding:20px;text-align:center;color:#ffffff;">
                <h2 style="margin:0;font-size:22px;">New ${safe.subject} Submission</h2>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:25px;">
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #eee;">
                      <strong style="color:#D70007;">Name:</strong><br/>
                      <span style="color:#333;">${safe.name}</span>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #eee;">
                      <strong style="color:#D70007;">Phone:</strong><br/>
                      <span style="color:#333;">${safe.phone}</span>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #eee;">
                      <strong style="color:#D70007;">Email:</strong><br/>
                      <span style="color:#333;">${safe.email}</span>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0;">
                      <strong style="color:#D70007;">Message:</strong><br/>
                      <span style="color:#333;line-height:1.5;">
                        ${safe.message}
                      </span>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#fafafa;padding:15px;text-align:center;font-size:12px;color:#777;">
                This email was generated from your website contact form.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
`;

  const userText = [
    "Hi " + name + ",",
    "",
    "Thanks for contacting us. Our team will get back to you shortly.",
    "",
    "Your message:",
    message,
    "",
    "— Prorevv",
  ].join("\n");

  const userHtml = `
  <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(90deg, rgba(215,0,7,1) 0%, rgba(160,0,6,1) 50%, rgba(97,1,5,1) 100%);padding:20px;text-align:center;color:#ffffff;">
                <h2 style="margin:0;font-size:22px;">Thank You for Contacting Us</h2>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:25px;">
                <p style="margin:0 0 15px 0;color:#333;">Hi ${safe.name}, 👋</p>

                <p style="margin:0 0 15px 0;color:#555;line-height:1.6;">
                  Thanks for reaching out to us. Our team has received your message and will get back to you shortly.
                </p>

                <div style="background:#fafafa;border-left:4px solid #D70007;padding:15px;margin:20px 0;">
                  <p style="margin:0 0 5px 0;color:#333;"><strong>Subject:</strong> ${safe.subject}</p>
                  <p style="margin:0;color:#333;"><strong>Your Message:</strong></p>
                  <p style="margin:8px 0 0 0;color:#555;line-height:1.5;">
                    ${safe.message}
                  </p>
                </div>

                <p style="margin:20px 0 0 0;color:#555;">
                  We appreciate your interest. 🚀
                </p>

                <p style="margin:20px 0 0 0;color:#333;">
                  — <strong>Prorevv Team</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#fafafa;padding:15px;text-align:center;font-size:12px;color:#777;">
                This is an automated confirmation email. Please do not reply directly.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
`;

  const adminsubjectmsg =
    safe.subject === 'Book a Demo' ? 'New Demo Request - Prorevv Platform'
      : safe.subject === 'Contact Sales' ? 'New Sales Inquiry: Pricing & Scaling Plans'
        : safe.subject === 'Get in Touch' ? 'Support Request: Technical Assistance Required'
          : safe.subject === 'Inquiry' ? 'Partnership Proposal: Collaboration Inquiry for Prorevv'
            : 'New Contact Request - Prorevv Platform'

  const adminMail = {
    from: `"Prorevv Contact" <${user}>`,
    to: adminEmail,
    replyTo: email,
    subject: `${adminsubjectmsg}`,
    text: adminText,
    html: adminHtml,
  };

  const userMail = {
    from: `"Prorevv" <${user}>`,
    to: email,
    subject: "We received your message - Prorevv",
    text: userText,
    html: userHtml,
  };

  try {
    await sendWithTransport(
      { host, port, secure, family, auth: { user, pass }, tls },
      [adminMail, userMail]
    );
  } catch (err) {
    const shouldRetry587 =
      port === 465 &&
      (err?.code === "ESOCKET" || err?.code === "ECONNECTION" || err?.errno === -4078);

    if (shouldRetry587) {
      try {
        await sendWithTransport(
          { host, port: 587, secure: false, family, auth: { user, pass }, tls },
          [adminMail, userMail]
        );
        return Response.json({ ok: true, fallback: 587 });
      } catch (retryErr) {
        console.error("contact API: fallback 587 send failed", retryErr);
      }
    }

    console.error("contact API: send failed", err);
    return Response.json(
      { error: "Email could not be sent. Please try again later." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
