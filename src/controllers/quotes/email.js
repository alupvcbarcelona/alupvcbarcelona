const { sendMail } = require("../../config/nodemailer");

const formatPrice = (value) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("es-ES");

const emailQuote = async (document) => {
  const rows = document.items
    .map(
      (item) => `
        <tr>
          <td>${item.description}</td>
          <td align="center">${item.quantity}</td>
          <td align="right">${formatPrice(item.unitPrice)}</td>
          <td align="right">${item.iva}%</td>
          <td align="right"><strong>${formatPrice(item.total)}</strong></td>
        </tr>
      `
    )
    .join("");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8"/>

<style>

body{
    margin:0;
    padding:30px;
    background:#f5f5f5;
    font-family:Arial,Helvetica,sans-serif;
}

.container{
    max-width:700px;
    margin:auto;
    background:white;
    border-radius:10px;
    overflow:hidden;
    border:1px solid #ddd;
}

.header{
    padding:30px;
    background:#1d3557;
    color:white;
}

.logo{
    width:120px;
    margin-bottom:15px;
}

.title{
    font-size:24px;
    margin:0;
}

.section{
    padding:30px;
}

.info{
    width:100%;
    border-collapse:collapse;
    margin-bottom:25px;
}

.info td{
    padding:4px 0;
}

table.items{
    width:100%;
    border-collapse:collapse;
}

table.items th{
    background:#f2f2f2;
    padding:12px;
    border:1px solid #ddd;
    font-size:14px;
}

table.items td{
    padding:12px;
    border:1px solid #ddd;
    font-size:14px;
}

.totals{
    width:300px;
    margin-left:auto;
    margin-top:25px;
}

.totals td{
    padding:8px;
}

.total{
    font-size:18px;
    font-weight:bold;
    border-top:2px solid #000;
}

.observations{
    margin-top:30px;
    background:#fafafa;
    padding:15px;
    border-left:4px solid #1d3557;
}

.footer{
    background:#f8f8f8;
    text-align:center;
    padding:20px;
    font-size:13px;
    color:#777;
}

</style>

</head>

<body>

<div class="container">

<div class="header">

<img class="logo" src="${document.company.logo}" />

<h1 class="title">Presupuesto ${document.number}</h1>

</div>

<div class="section">

<p>Hola <strong>${document.client.name}</strong>,</p>

<p>
Gracias por confiar en <strong>${document.company.name}</strong>.
Adjuntamos el presupuesto solicitado.
Si tienes cualquier duda estaremos encantados de ayudarte.
</p>

<table class="info">

<tr>
<td><strong>Fecha:</strong></td>
<td>${formatDate(document.issueDate)}</td>
</tr>

<tr>
<td><strong>Cliente:</strong></td>
<td>${document.client.name}</td>
</tr>

${
  document.client.address
    ? `
<tr>
<td><strong>Dirección:</strong></td>
<td>${document.client.address}</td>
</tr>`
    : ""
}

${
  document.client.nif
    ? `
<tr>
<td><strong>NIF:</strong></td>
<td>${document.client.nif}</td>
</tr>`
    : ""
}

</table>

<table class="items">

<thead>

<tr>
<th align="left">Descripción</th>
<th>Cant.</th>
<th align="right">Precio</th>
<th align="right">IVA</th>
<th align="right">Total</th>
</tr>

</thead>

<tbody>

${rows}

</tbody>

</table>

<table class="totals">

<tr>
<td>Subtotal</td>
<td align="right">${formatPrice(document.subtotal)}</td>
</tr>

<tr>
<td>IVA</td>
<td align="right">${formatPrice(document.totalIVA)}</td>
</tr>

<tr class="total">
<td>Total</td>
<td align="right">${formatPrice(document.grandTotal)}</td>
</tr>

</table>

${
  document.observations
    ? `
<div class="observations">

<strong>Observaciones</strong>

<p>${document.observations}</p>

</div>
`
    : ""
}

<p style="margin-top:35px;">
Si deseas aceptar este presupuesto simplemente responde a este correo o ponte en contacto con nosotros.
</p>

<p>

<strong>${document.company.owner}</strong><br>

${document.company.name}<br>

📞 ${document.company.phone}<br>

✉️ ${document.company.email}<br>

🌐 <a href="${document.company.website}">
${document.company.website}
</a>

</p>

</div>

<div class="footer">

© ${new Date().getFullYear()} ${document.company.name}<br>

Gracias por confiar en nosotros.

</div>

</div>

</body>

</html>
`;

  await sendMail(
    document.client.email,
    [document.company.email],
    `Presupuesto ${document.number} - ${document.company.name}`,
    htmlContent
  );
};

module.exports = {
  emailQuote,
};