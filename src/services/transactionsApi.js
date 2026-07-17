import { supabase } from "../lib/supabaseClient";

const mapTransactionFromDb = (transaction) => {
  return {
    id: transaction.id,
    userId: transaction.user_id,
    title: transaction.title,
    amount: Number(transaction.amount || 0),
    type: transaction.type,
    date: transaction.transaction_date,
    sourceType: transaction.source_type || "manual",
    sourceId: transaction.source_id,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
  };
};

const mapTransactionToDb = (userId, transaction) => {
  return {
    user_id: userId,
    title: transaction.title,
    amount: Number(transaction.amount || 0),
    type: transaction.type,
    transaction_date: transaction.date || new Date().toISOString(),
    source_type: transaction.sourceType || "manual",
    source_id: transaction.sourceId || null,
  };
};

export const fetchTransactions = async (userId) => {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, user_id, title, amount, type, transaction_date, source_type, source_id, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  if (error) {
    return { data: [], error };
  }

  return {
    data: data.map(mapTransactionFromDb),
    error: null,
  };
};

export const insertTransaction = async (userId, transaction) => {
  const { data, error } = await supabase
    .from("transactions")
    .insert([mapTransactionToDb(userId, transaction)])
    .select(
      "id, user_id, title, amount, type, transaction_date, source_type, source_id, created_at, updated_at"
    )
    .single();

  if (error) {
    return { data: null, error };
  }

  return {
    data: mapTransactionFromDb(data),
    error: null,
  };
};

export const deleteTransactionRecord = async (userId, transactionId) => {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", userId);

  return { error };
};

export const clearTransactionRecords = async (userId) => {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId);

  return { error };
};