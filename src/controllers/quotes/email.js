const { sendMail } = require('../../../config/nodemailer')

const emailWelcome = async (user) => {
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
          }

          a {
            color: #000000;
            text-decoration: none;
            font-weight: bold;
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

          .footer img {
            max-width: 100px;
            margin-bottom: 10px;
          }

          .signature {
            font-size: 14px;
            margin-top: 10px; 
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
            <h1>Bienvenido, <strong>${user.name}</strong></h1>
          </div>
          <p>Gracias por unirte a nuestra comunidad.</p>
          <p>Ya puedes comenzar a disfrutar de grandes descuentos en tus establecimientos favoritos.</p>
          <p>Si tienes alguna pregunta o necesitas ayuda, puedes contactar con nosotros respondiendo a este correo o escribiendo a <strong>packeo.es@gmail.com</strong>.</p>
          <p>Gracias por confiar en nosotros.</p>
          <br>
          
          <div class="signature">
            <p>Cordialmente,</p>
            <p>CEO - Founder Packeo</p>
            <p><a href="https://packeo.es">packeo.es</a></p>
          </div>

          <div class="footer">
            <div class="footer-content">
              <h2><strong>PACKEO</strong></h2>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
  await sendMail(user.email, `Bienvenid@ ${user.name}`, htmlContent)
}

module.exports = { emailWelcome }