const Document = require("../../models/quote.model");
const Counter = require("../../models/Counter");
const { emailQuote } = require("./email");

//======================================================
// GENERATE DOCUMENT NUMBER
//======================================================

const generateNumber = async () => {
  const year = new Date().getFullYear();

  let counter = await Counter.findOne({ year });

  if (!counter) {
    counter = await Counter.create({
      year,
      sequence: 1,
    });
  } else {
    counter.sequence += 1;
    await counter.save();
  }

  return `${year}-${String(counter.sequence).padStart(6, "0")}`;
};

//======================================================
// CALCULATE TOTALS
//======================================================

const calculateTotals = (items) => {
  let subtotal = 0;
  let totalIVA = 0;

  const documentItems = items.map((item, index) => {
    if (!item.description?.trim()) {
      throw new Error(
        `El servicio de la línea ${index + 1} no tiene descripción.`,
      );
    }

    if (!item.quantity || item.quantity <= 0) {
      throw new Error(
        `La cantidad de la línea ${index + 1} debe ser mayor que cero.`,
      );
    }

    if (item.unitPrice == null || item.unitPrice < 0) {
      throw new Error(
        `El precio unitario de la línea ${index + 1} es incorrecto.`,
      );
    }

    const lineSubtotal = item.quantity * item.unitPrice;
    const ivaAmount = lineSubtotal * 0.21;
    const total = lineSubtotal + ivaAmount;

    subtotal += lineSubtotal;
    totalIVA += ivaAmount;

    return {
      quantity: item.quantity,
      description: item.description.trim(),
      unitPrice: item.unitPrice,
      subtotal: lineSubtotal,
      iva: 21,
      ivaAmount,
      total,
    };
  });

  return {
    items: documentItems,
    subtotal,
    totalIVA,
    grandTotal: subtotal + totalIVA,
  };
};

//======================================================
// CREATE
//======================================================

const CREATE_QUOTE = async (req, res, next) => {
  try {
    const { type, client, items, observations } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "El tipo de documento es obligatorio.",
      });
    }

    if (!client?.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "El nombre del cliente es obligatorio.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe añadir al menos un servicio.",
      });
    }

    const totals = calculateTotals(items);

    const document = await Document.create({
      ...req.body,
      number: await generateNumber(),
      year: new Date().getFullYear(),
      observations: observations || "",
      ...totals,
    });

    //SENT EMAIL
    await emailQuote(document);

    return res.status(201).json({
      success: true,
      message: "Documento creado correctamente.",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

//======================================================
// GET ALL
//======================================================

const GET_QUOTES = async (req, res, next) => {
  try {
    const documents = await Document.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      total: documents.length,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

//======================================================
// GET ONE
//======================================================

const GET_QUOTE = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Documento no encontrado.",
      });
    }

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

//======================================================
// UPDATE
//======================================================

const UPDATE_QUOTE = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Documento no encontrado.",
      });
    }

    if (req.body.items) {
      const totals = calculateTotals(req.body.items);

      req.body.items = totals.items;
      req.body.subtotal = totals.subtotal;
      req.body.totalIVA = totals.totalIVA;
      req.body.grandTotal = totals.grandTotal;
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Documento actualizado correctamente.",
      data: updatedDocument,
    });
  } catch (error) {
    next(error);
  }
};

//======================================================
// DELETE
//======================================================

const DELETE_QUOTE = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Documento no encontrado.",
      });
    }

    await document.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Documento eliminado correctamente.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  CREATE_QUOTE,
  GET_QUOTES,
  GET_QUOTE,
  UPDATE_QUOTE,
  DELETE_QUOTE,
};
