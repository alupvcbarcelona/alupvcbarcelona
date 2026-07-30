const { sendMail } = require("../../config/nodemailer");

const emailWelcome = async (user, loginInfo) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #ebebeb;
            font-family: Arial, sans-serif;
            color: #333333;
          }

          .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 30px;
            background: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, .1);
          }

          .header {
            margin-bottom: 25px;
          }

          .header h1 {
            margin: 0;
            font-size: 18px;
            color: #000000;
          }

          p {
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 16px;
          }

          a {
            color: #000000;
            text-decoration: none;
            font-weight: bold;
          }

          .info-box {
            margin: 25px 0;
            padding: 20px;
            background: #f8f8f8;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          table td {
            padding: 10px 0;
            border-bottom: 1px solid #dddddd;
            vertical-align: top;
          }

          table tr:last-child td {
            border-bottom: none;
          }

          table td:first-child {
            width: 180px;
            font-weight: bold;
            color: #000000;
          }

          .signature {
            margin-top: 30px;
            font-size: 14px;
          }

          .signature p {
            margin: 4px 0;
          }

          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 12px;
            color: #555555;
          }

          .footer h2 {
            margin: 0;
            font-size: 18px;
            color: #000000;
          }
        </style>
      </head>

      <body>
        <div class="container">

          <div class="header">
            <h1>Hola ${user.name},</h1>
          </div>

          <p>
            Hemos registrado un <strong>nuevo inicio de sesión</strong> en tu cuenta
            de <strong>ALUPVC-BARCELONA</strong>.
          </p>

          <p>
            Si has sido tú, puedes ignorar este correo.
            En caso contrario, ponte en contacto con Daniele lo antes posible en el
            <strong>+34 722 650 507</strong>.
          </p>

          <div class="info-box">
            <table>
              <tr>
                <td>IP</td>
                <td>${loginInfo.ip}</td>
              </tr>

              <tr>
                <td>Ubicación</td>
                <td>
                  ${loginInfo.city},
                  ${loginInfo.region},
                  ${loginInfo.country}
                </td>
              </tr>

              <tr>
                <td>Dispositivo</td>
                <td>${loginInfo.device}</td>
              </tr>

              <tr>
                <td>Sistema operativo</td>
                <td>${loginInfo.os} ${loginInfo.osVersion}</td>
              </tr>

              <tr>
                <td>Navegador</td>
                <td>${loginInfo.browser} ${loginInfo.browserVersion}</td>
              </tr>
            </table>
          </div>

          <div class="signature">
            <p>Cordialmente,</p>
            <p>Daniele</p>
            <p>Team Developers</p>
            <p>+34 722650507</p>
            <p>mazzoladaniele@gmail.com</p>
            <p>
              <a href="https://alupvcbarcelona.es">
                alupvcbarcelona.es
              </a>
            </p>
          </div>

          <div class="footer">
            <h2>ALUPVC-BARCELONA</h2>
          </div>

        </div>
      </body>
    </html>
  `;

  await sendMail(
    user.email,
    [],
    `Inicio de sesión detectado, ${user.name}`,
    htmlContent,
  );
};

const emailNewPassword = async (user) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #ebebeb;
            margin: 0;
            padding: 0;
          }

          .container {
            background-color: #ffffff;
            max-width: 600px;
            margin: 40px auto;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            color: #333333;
          }

          .header {
            margin-bottom: 20px;
          }

          .header h1 {
            font-size: 16px;
            color: #000000;
            font-weight: bold;
            margin: 0;
          }

          p {
            font-size: 16px;
            font-weight: 300;
            color: #333333;
            line-height: 1.6;
          }

          a {
            color: #000000;
            text-decoration: none;
            font-weight: bold;
          }

          .alert {
            background-color: #f8f8f8;
            border-left: 4px solid #000000;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }

          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #333333;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            padding-top: 10px;
          }

          .footer-content {
            text-align: center;
            margin: 10px 0;
          }

          .signature {
            font-size: 14px;
            margin-top: 20px;
            text-align: left;
          }

          .signature p {
            margin: 3px 0;
          }
        </style>
      </head>

      <body>
        <div class="container">

          <div class="header">
            <h1>Hola ${user.name},</h1>
          </div>

          <p>Te confirmamos que la contraseña de tu cuenta de <strong>ALUPVC-BARCELONA</strong> ha sido actualizada correctamente.</p>

          <div class="alert">
            <strong>¿No has sido tú?</strong><br>
            Si no reconoces este cambio, ponte en contacto con Daniele lo antes posible en el teléfono <strong>+34 722 650 507</strong>.
          </div>

          <div class="signature">
            <p>Cordialmente,</p>
            <p>Daniele</p>
            <p>Team Developers</p>
            <p>+34 722650507</p>
            <p>mazzoladaniele@gmail.com</p>
            <p><a href="https://alupvcbarcelona.es">alupvcbarcelona.es</a></p>
          </div>

          <div class="footer">
            <div class="footer-content">
              <h2><strong>ALUPVC-BARCELONA</strong></h2>
            </div>
          </div>

        </div>
      </body>
    </html>
  `;

  await sendMail(
    user.email,
    [],
    `Contraseña actualizada, ${user.name}`,
    htmlContent,
  );
};

module.exports = { emailWelcome, emailNewPassword };
