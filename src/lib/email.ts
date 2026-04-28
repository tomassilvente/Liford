import { Resend } from "resend";

export async function sendPasswordResetEmail(to: string, username: string, resetUrl: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Liford <onboarding@resend.dev>",
    to,
    subject: "Restablecer contraseña — Liford",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#171717;border-radius:16px;border:1px solid #262626;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#ffffff;">Liford</p>
              <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#ffffff;">Restablecer contraseña</p>
              <p style="margin:0 0 24px;font-size:14px;color:#a3a3a3;line-height:1.6;">
                Hola <strong style="color:#e5e5e5;">${username}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#a3a3a3;line-height:1.6;">
                Hacé clic en el botón para crear una nueva contraseña. Este link es válido por <strong style="color:#e5e5e5;">1 hora</strong>.
              </p>
              <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:24px;">
                Restablecer contraseña
              </a>
              <p style="margin:0 0 8px;font-size:12px;color:#525252;line-height:1.6;">
                Si no pediste restablecer tu contraseña, ignorá este email. Tu contraseña no va a cambiar.
              </p>
              <p style="margin:0;font-size:11px;color:#404040;">
                O copiá este link en tu navegador:<br>
                <span style="color:#3b82f6;word-break:break-all;">${resetUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #262626;">
              <p style="margin:0;font-size:11px;color:#404040;">Liford · Tu gestor personal de finanzas</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
