const MESSAGE_MODEL = require("../../models/message.model");
const DOCUMENT_MODEL = require("../../models/document.model");
const REVIEW_MODEL = require("../../models/review.model");
const POST_MODEL = require("../../models/post.model");
const VISIT_MODEL = require("../../models/visit.model");

//======================================================
// ADMIN: SUMMARY FOR THE HOME OF THE DASHBOARD
//======================================================
const GET_SUMMARY = async (req, res) => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const last7 = new Date(now.getTime() - 7 * 86_400_000);
  const last30 = new Date(now.getTime() - 30 * 86_400_000);

  const [
    unreadMessages,
    latestMessages,
    pendingReviews,
    publishedPosts,
    visits7,
    visits30,
    visitors30,
    quotesOpen,
    invoicesPending,
    invoicesYear,
    latestDocuments,
    quotesYear,
  ] = await Promise.all([
    MESSAGE_MODEL.countDocuments({ status: "nuevo" }),
    MESSAGE_MODEL.find({ status: { $ne: "archivado" } }).sort({ createdAt: -1 }).limit(5).select("name service message status createdAt"),
    REVIEW_MODEL.countDocuments({ approved: false }),
    POST_MODEL.countDocuments({ published: true }),
    VISIT_MODEL.countDocuments({ createdAt: { $gte: last7 } }),
    VISIT_MODEL.countDocuments({ createdAt: { $gte: last30 } }),
    VISIT_MODEL.distinct("visitorId", { createdAt: { $gte: last30 } }),
    DOCUMENT_MODEL.find({ type: "presupuesto", status: { $in: ["borrador", "enviado", "pendiente"] } }).select("grandTotal -_id").lean(),
    DOCUMENT_MODEL.find({ type: "factura", status: { $in: ["pendiente", "enviado", "vencido"] } }).select("grandTotal -_id").lean(),
    DOCUMENT_MODEL.find({ type: "factura", status: { $ne: "anulado" }, issueDate: { $gte: yearStart } })
      .select("issueDate subtotal status -_id")
      .lean(),
    DOCUMENT_MODEL.find().sort({ createdAt: -1 }).limit(6).select("type number client.name grandTotal status issueDate"),
    DOCUMENT_MODEL.find({ type: "presupuesto", issueDate: { $gte: yearStart } }).select("status -_id").lean(),
  ]);

  // INVOICED / PAID PER MONTH (TAX BASE, MADRID TIME)
  const MONTH = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", month: "numeric" });
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, invoiced: 0, paid: 0 }));
  invoicesYear.forEach((invoice) => {
    const month = months[Number(MONTH.format(invoice.issueDate)) - 1];
    month.invoiced += invoice.subtotal || 0;
    if (invoice.status === "pagado") month.paid += invoice.subtotal || 0;
  });

  const SUM = (docs) => docs.reduce((sum, d) => sum + (d.grandTotal || 0), 0);
  const quoteStatus = {};
  quotesYear.forEach((q) => (quoteStatus[q.status] = (quoteStatus[q.status] || 0) + 1));
  const decided = (quoteStatus.aceptado || 0) + (quoteStatus.rechazado || 0);

  return res.status(200).json({
    success: true,
    data: {
      messages: { unread: unreadMessages, latest: latestMessages },
      reviews: { pending: pendingReviews },
      posts: { published: publishedPosts },
      visits: { last7: visits7, last30: visits30, visitors30: visitors30.length },
      quotes: {
        open: quotesOpen.length,
        openAmount: SUM(quotesOpen),
        acceptanceRate: decided ? Math.round(((quoteStatus.aceptado || 0) / decided) * 100) : null,
        byStatus: quoteStatus,
      },
      invoices: {
        pending: invoicesPending.length,
        pendingAmount: SUM(invoicesPending),
        yearInvoiced: months.reduce((s, m) => s + m.invoiced, 0),
        yearPaid: months.reduce((s, m) => s + m.paid, 0),
        byMonth: months,
      },
      latestDocuments,
    },
  });
};

module.exports = { GET_SUMMARY };
