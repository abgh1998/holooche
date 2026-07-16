import { supabase } from "../lib/supabaseClient";

const mapProductFromDb = (product) => {
  return {
    id: product.id,
    userId: product.user_id,
    code: product.code,
    name: product.name,
    type: product.type,
    unit: product.unit || "عدد",
    category: product.category || "",
    buyPrice: Number(product.buy_price || 0),
    salePrice: Number(product.sale_price || 0),
    stock: Number(product.stock || 0),
    minStock: Number(product.min_stock || 0),
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
};

const mapProductToDb = (userId, product) => {
  return {
    user_id: userId,
    code: product.code,
    name: product.name,
    type: product.type,
    unit: product.unit || "عدد",
    category: product.category || "",
    buy_price: Number(product.buyPrice || 0),
    sale_price: Number(product.salePrice || 0),
    stock: Number(product.stock || 0),
    min_stock: Number(product.minStock || 0),
  };
};

export const fetchProducts = async (userId) => {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, user_id, code, name, type, unit, category, buy_price, sale_price, stock, min_stock, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error };
  }

  return {
    data: data.map(mapProductFromDb),
    error: null,
  };
};

export const insertProduct = async (userId, product) => {
  const { data, error } = await supabase
    .from("products")
    .insert([mapProductToDb(userId, product)])
    .select(
      "id, user_id, code, name, type, unit, category, buy_price, sale_price, stock, min_stock, created_at, updated_at"
    )
    .single();

  if (error) {
    return { data: null, error };
  }

  return {
    data: mapProductFromDb(data),
    error: null,
  };
};

export const updateProductRecord = async (userId, product) => {
  const { data, error } = await supabase
    .from("products")
    .update({
      ...mapProductToDb(userId, product),
      updated_at: new Date().toISOString(),
    })
    .eq("id", product.id)
    .eq("user_id", userId)
    .select(
      "id, user_id, code, name, type, unit, category, buy_price, sale_price, stock, min_stock, created_at, updated_at"
    )
    .single();

  if (error) {
    return { data: null, error };
  }

  return {
    data: mapProductFromDb(data),
    error: null,
  };
};

export const deleteProductRecord = async (userId, productId) => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("user_id", userId);

  return { error };
  };