import { supabase } from "../lib/supabaseClient";

const purchaseInvoiceSelect = `
  id,
  user_id,
  invoice_number,
  supplier_id,
  supplier_name,
  subtotal,
  total_discount,
  final_total,
  payment_status,
  paid_amount,
  remaining_amount,
  note,
  created_at,
  updated_at,
  purchase_invoice_rows (
    id,
    invoice_id,
    user_id,
    product_id,
    product_code,
    product_name,
    product_type,
    unit,
    quantity,
    buy_price,
    discount,
    row_total,
    created_at
  )
`;

const mapRowFromDb = (row) => {
  return {
    rowId: row.id,
    productId: row.product_id,
    code: row.product_code || "",
    name: row.product_name,
    type: row.product_type || "product",
    unit: row.unit || "عدد",
    quantity: Number(row.quantity || 0),
    buyPrice: Number(row.buy_price || 0),
    discount: Number(row.discount || 0),
    rowTotal: Number(row.row_total || 0),
    createdAt: row.created_at,
  };
};

const mapPurchaseInvoiceFromDb = (invoice) => {
  return {
    id: invoice.id,
    userId: invoice.user_id,
    invoiceNumber: invoice.invoice_number,
    supplierId: invoice.supplier_id,
    supplierName: invoice.supplier_name,
    rows: (invoice.purchase_invoice_rows || []).map(mapRowFromDb),
    subtotal: Number(invoice.subtotal || 0),
    totalDiscount: Number(invoice.total_discount || 0),
    finalTotal: Number(invoice.final_total || 0),
    paymentStatus: invoice.payment_status || "unpaid",
    paidAmount: Number(invoice.paid_amount || 0),
    remainingAmount: Number(
      invoice.remaining_amount ?? invoice.final_total ?? 0
    ),
    note: invoice.note || "",
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
  };
};

const getPaymentStatus = (finalTotal, paidAmount) => {
  const finalValue = Number(finalTotal || 0);
  const paidValue = Number(paidAmount || 0);

  if (paidValue <= 0) {
    return "unpaid";
  }

  if (paidValue >= finalValue) {
    return "paid";
  }

  return "partial";
};

const mapPurchaseInvoiceToDb = (userId, invoice) => {
  const finalTotal = Number(invoice.finalTotal || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const remainingAmount =
    invoice.remainingAmount !== undefined
      ? Number(invoice.remainingAmount || 0)
      : Math.max(finalTotal - paidAmount, 0);

  return {
    user_id: userId,
    invoice_number: invoice.invoiceNumber,
    supplier_id: invoice.supplierId,
    supplier_name: invoice.supplierName,
    subtotal: Number(invoice.subtotal || 0),
    total_discount: Number(invoice.totalDiscount || 0),
    final_total: finalTotal,
    payment_status:
      invoice.paymentStatus || getPaymentStatus(finalTotal, paidAmount),
    paid_amount: paidAmount,
    remaining_amount: remainingAmount,
    note: invoice.note || "",
  };
};

const mapRowToDb = (userId, invoiceId, row) => {
  const quantity = Number(row.quantity || 0);
  const buyPrice = Number(row.buyPrice || 0);
  const discount = Number(row.discount || 0);

  return {
    invoice_id: invoiceId,
    user_id: userId,
    product_id: row.productId,
    product_code: row.code || "",
    product_name: row.name,
    product_type: row.type || "product",
    unit: row.unit || "عدد",
    quantity,
    buy_price: buyPrice,
    discount,
    row_total: Math.max(quantity * buyPrice - discount, 0),
  };
};

export const fetchPurchaseInvoices = async (userId) => {
  const { data, error } = await supabase
    .from("purchase_invoices")
    .select(purchaseInvoiceSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error };
  }

  return {
    data: data.map(mapPurchaseInvoiceFromDb),
    error: null,
  };
};

export const insertPurchaseInvoice = async (userId, invoice) => {
  const invoicePayload = {
    ...invoice,
    paymentStatus: invoice.paymentStatus || "unpaid",
    paidAmount: Number(invoice.paidAmount || 0),
    remainingAmount:
      invoice.remainingAmount !== undefined
        ? Number(invoice.remainingAmount || 0)
        : Number(invoice.finalTotal || 0),
  };

  const { data: invoiceData, error: invoiceError } = await supabase
    .from("purchase_invoices")
    .insert([mapPurchaseInvoiceToDb(userId, invoicePayload)])
    .select(
      "id, user_id, invoice_number, supplier_id, supplier_name, subtotal, total_discount, final_total, payment_status, paid_amount, remaining_amount, note, created_at, updated_at"
    )
    .single();

  if (invoiceError) {
    return { data: null, error: invoiceError };
  }

  const rowsPayload = invoice.rows.map((row) =>
    mapRowToDb(userId, invoiceData.id, row)
  );

  const { data: rowsData, error: rowsError } = await supabase
    .from("purchase_invoice_rows")
    .insert(rowsPayload)
    .select(
      "id, invoice_id, user_id, product_id, product_code, product_name, product_type, unit, quantity, buy_price, discount, row_total, created_at"
    );

  if (rowsError) {
    return { data: null, error: rowsError };
  }

  const productRows = invoice.rows.filter(
    (row) => row.type === "product" && row.productId
  );

  for (const row of productRows) {
    const nextStock =
      Number(row.stock || 0) + Number(row.quantity || 0);

    const { error: stockError } = await supabase
      .from("products")
      .update({
        stock: nextStock,
        buy_price: Number(row.buyPrice || 0),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.productId)
      .eq("user_id", userId);

    if (stockError) {
      return { data: null, error: stockError };
    }
  }

  return {
    data: mapPurchaseInvoiceFromDb({
      ...invoiceData,
      purchase_invoice_rows: rowsData || [],
    }),
    error: null,
  };
};

export const updatePurchaseInvoiceSettlement = async (
  userId,
  invoiceId,
  finalTotal,
  paidAmount
) => {
  const finalValue = Number(finalTotal || 0);
  const paidValue = Number(paidAmount || 0);
  const remainingAmount = Math.max(finalValue - paidValue, 0);
  const paymentStatus = getPaymentStatus(finalValue, paidValue);

  const { data, error } = await supabase
    .from("purchase_invoices")
    .update({
      payment_status: paymentStatus,
      paid_amount: paidValue,
      remaining_amount: remainingAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .select(purchaseInvoiceSelect)
    .single();

  if (error) {
    return { data: null, error };
  }

  return {
    data: mapPurchaseInvoiceFromDb(data),
    error: null,
  };
};
