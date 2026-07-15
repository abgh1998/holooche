import { supabase } from "../lib/supabaseClient";

const mapPartyFromDb = (party) => {
  return {
    id: party.id,
    userId: party.user_id,
    name: party.name,
    type: party.type,
    phone: party.phone || "",
    address: party.address || "",
    openingBalance: Number(party.opening_balance || 0),
    balanceStatus: party.balance_status || "none",
    createdAt: party.created_at,
    updatedAt: party.updated_at,
  };
};

const mapPartyToDb = (userId, party) => {
  return {
    user_id: userId,
    name: party.name,
    type: party.type,
    phone: party.phone || "",
    address: party.address || "",
    opening_balance: Number(party.openingBalance || 0),
    balance_status: party.balanceStatus || "none",
  };
};

export const fetchParties = async (userId) => {
  const { data, error } = await supabase
    .from("parties")
    .select(
      "id, user_id, name, type, phone, address, opening_balance, balance_status, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error };
  }

  return {
    data: data.map(mapPartyFromDb),
    error: null,
  };
};

export const insertParty = async (userId, party) => {
  const { data, error } = await supabase
    .from("parties")
    .insert([mapPartyToDb(userId, party)])
    .select(
      "id, user_id, name, type, phone, address, opening_balance, balance_status, created_at, updated_at"
    )
    .single();

  if (error) {
    return { data: null, error };
  }

  return {
    data: mapPartyFromDb(data),
    error: null,
  };
};

export const updatePartyRecord = async (userId, party) => {
  const { data, error } = await supabase
    .from("parties")
    .update({
      ...mapPartyToDb(userId, party),
      updated_at: new Date().toISOString(),
    })
    .eq("id", party.id)
    .eq("user_id", userId)
    .select(
      "id, user_id, name, type, phone, address, opening_balance, balance_status, created_at, updated_at"
    )
    .single();

  if (error) {
    return { data: null, error };
  }

  return {
    data: mapPartyFromDb(data),
    error: null,
  };
};

export const deletePartyRecord = async (userId, partyId) => {
  const { error } = await supabase
    .from("parties")
    .delete()
    .eq("id", partyId)
    .eq("user_id", userId);

  return { error };
};