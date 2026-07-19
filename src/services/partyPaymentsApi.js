import { supabase } from "../lib/supabaseClient";

const paymentSelect = `
  id,
  user_id,
  party_id,
  invoice_id,
  payment_type,
  amount,
  payment_method,
  reference_number,
  note,
  payment_date,
  created_at,
  updated_at
`;

const mapPaymentFromDb = (payment) => {
  return {
    id: payment.id,
    userId: payment.user_id,
    partyId: payment.party_id,
    invoiceId: payment.invoice_id,
    paymentType: payment.payment_type,
    amount: Number(payment.amount || 0),
    paymentMethod: payment.payment_method || "cash",
    referenceNumber: payment.reference_number || "",
    note: payment.note || "",
    paymentDate: payment.payment_date,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  };
};

const mapPaymentToDb = (userId, payment) => {
  return {
    user_id: userId,
    party_id: payment.partyId,
    invoice_id: payment.invoiceId || null,
    payment_type: payment.paymentType || "receive",
    amount: Number(payment.amount || 0),
    payment_method: payment.paymentMethod || "cash",
    reference_number: payment.referenceNumber || "",
    note: payment.note || "",
    payment_date: payment.paymentDate || new Date().toISOString(),
  };
};

export const fetchPartyPayments = async (userId) => {
  const { data, error } = await supabase
    .from("party_payments")
    .select(paymentSelect)
    .eq("user_id", userId)
    .order("payment_date", { ascending: false });

  if (error) {
    return { data: [], error };
  }

  return {
    data: data.map(mapPaymentFromDb),
    error: null,
  };
};

export const fetchPartyPaymentsByPartyId = async (userId, partyId) => {
  const { data, error } = await supabase
    .from("party_payments")
    .select(paymentSelect)
    .eq("user_id", userId)
    .eq("party_id", partyId)
    .order("payment_date", { ascending: false });

  if (error) {
    return { data: [], error };
  }

  return {
    data: data.map(mapPaymentFromDb),
    error: null,
  };
};

export const insertPartyPayment = async (userId, payment) => {
  const { data, error } = await supabase
    .from("party_payments")
    .insert([mapPaymentToDb(userId, payment)])
    .select(paymentSelect)
    .single();

  if (error) {
    return { data: null, error };
  }

  return {
    data: mapPaymentFromDb(data),
    error: null,
  };
};

export const updatePartyPaymentRecord = async (userId, payment) => {
  const { data, error } = await supabase
    .from("party_payments")
    .update({
      ...mapPaymentToDb(userId, payment),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("user_id", userId)
    .select(paymentSelect)
    .single();

  if (error) {
    return { data: null, error };
  }

  return {
    data: mapPaymentFromDb(data),
    error: null,
  };
};

export const deletePartyPaymentRecord = async (userId, paymentId) => {
  const { error } = await supabase
    .from("party_payments")
    .delete()
    .eq("id", paymentId)
    .eq("user_id", userId);

  return { error };
};
