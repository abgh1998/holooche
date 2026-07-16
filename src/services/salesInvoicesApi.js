import { supabase } from "../lib/supabaseClient";

const invoiceSelect = `
  id,
  user_id,
  invoice_number,
  customer_id,
  customer_name,
  subtotal,
  total_discount,
  final_total,
  note,
  created_at,
  updated_at,
  sales_invoice_rows (
    id,
    invoice_id,
    user_id,
    product_id,
    product_code,
    product_name,
    product_type,
    unit,
    quantity,
    sale_price,
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
    type: row.product_type,
    unit: row.unit || "عدد",
    quantity: Number(row.quantity || 0),
    salePrice: Number(row.sale_price || 0),
    discount: Number(row.discount || 0),
    rowTotal: Number(row.row_total || 0),
    createdAt: row.created_at,
  };
};

const mapInvoiceFromDb = (invoice) => {
  return {
    id: invoice.id,
    userId: invoice.user_id,
    invoiceNumber: invoice.invoice_number,
    customerId: invoice.customer_id,
    customerName: invoice.customer_name,
    rows: (invoice.sales_invoice_rows || []).map(mapRowFromDb),
    subtotal: Number(invoice.subtotal || 0),
    totalDiscount: Number(invoice.total_discount || 0),
    finalTotal: Number(invoice.final_total || 0),
    note: invoice.note || "",
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
  };
};

const mapInvoiceToDb = (userId, invoice) => {
  return {
    user_id: userId,
    invoice_number: invoice.invoiceNumber,
    customer_id: invoice.customerId,
    customer_name: invoice.customerName,
    subtotal: Number(invoice.subtotal || 0),
    total_discount: Number(invoice.totalDiscount || 0),
    final_total: Number(invoice.finalTotal || 0),
    note: invoice.note || "",
  };
};

const mapRowToDb = (userId, invoiceId, row) => {
  const quantity = Number(row.quantity || 0);
  const salePrice = Number(row.salePrice || 0);
  const discount = Number(row.discount || 0);

  return {
    invoice_id: invoiceId,
    user_id: userId,
    product_id: row.productId,
    product_code: row.code || "",
    product_name: row.name,
    product_type: row.type,
    unit: row.unit || "عدد",
    quantity,
    sale_price: salePrice,
    discount,
    row_total: Math.max(quantity * salePrice - discount, 0),
  };
};

export const fetchSalesInvoices = async (userId) => {
  const { data, error } = await supabase
    .from("sales_invoices")
    .select(invoiceSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error };
  }

  return {
    data: data.map(mapInvoiceFromDb),
    error: null,
  };
};

export const insertSalesInvoice = async (userId, invoice) => {
  const { data: invoiceData, error: invoiceError } = await supabase
    .from("sales_invoices")
    .insert([mapInvoiceToDb(userId, invoice)])
    .select(
      "id, user_id, invoice_number, customer_id, customer_name, subtotal, total_discount, final_total, note, created_at, updated_at"
    )
    .single();

  if (invoiceError) {
    return { data: null, error: invoiceError };
  }

  const rowsPayload = invoice.rows.map((row) =>
    mapRowToDb(userId, invoiceData.id, row)
  );

  const { data: rowsData, error: rowsError } = await supabase
    .from("sales_invoice_rows")
    .insert(rowsPayload)
    .select(
      "id, invoice_id, user_id, product_id, product_code, product_name, product_type, unit, quantity, sale_price, discount, row_total, created_at"
    );

  if (rowsError) {
    return { data: null, error: rowsError };
  }

  const productRows = invoice.rows.filter(
    (row) => row.type === "product" && row.productId
  );

  for (const row of productRows) {
    const nextStock = Math.max(
      Number(row.stock || 0) - Number(row.quantity || 0),
      0
    );

    const { error: stockError } = await supabase
      .from("products")
      .update({
        stock: nextStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.productId)
      .eq("user_id", userId);

    if (stockError) {
      return { data: null, error: stockError };
    }
  }

  return {
    data: mapInvoiceFromDb({
      ...invoiceData,
      sales_invoice_rows: rowsData || [],
    }),
    error: null,
  };
};