import { useEffect, useState } from "react";
import Header from "./components/Header";
import MainMenu from "./components/MainMenu";
import Balance from "./components/Balance";
import Summary from "./components/Summary";
import Chart from "./components/Chart";
import ManagementReport from "./components/ManagementReport";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import Invoice from "./components/Invoice";
import Auth from "./components/Auth";
import CustomersPage from "./components/CustomersPage";
import ProductsPage from "./components/ProductsPage";
import SalesInvoicePage from "./components/SalesInvoicePage";
import ReportsPage from "./components/ReportsPage";
import CustomerLedgerPage from "./components/CustomerLedgerPage";
import { supabase } from "./lib/supabaseClient";

import {
  fetchParties,
  insertParty,
  updatePartyRecord,
  deletePartyRecord,
} from "./services/partiesApi";

import {
  fetchProducts,
  insertProduct,
  updateProductRecord,
  deleteProductRecord,
} from "./services/productsApi";

import {
  fetchSalesInvoices,
  insertSalesInvoice,
  updateSalesInvoiceSettlement,
} from "./services/salesInvoicesApi";

import {
  fetchTransactions,
  insertTransaction,
  deleteTransactionRecord,
  clearTransactionRecords,
} from "./services/transactionsApi";

import {
  fetchPartyPayments,
  insertPartyPayment,
  deletePartyPaymentRecord,
} from "./services/partyPaymentsApi";

const CURRENT_USER_KEY = "financeCurrentUser";

const getSavedCurrentUser = () => {
  const savedUser = localStorage.getItem(CURRENT_USER_KEY);

  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  }

  return null;
};

const getSafeEmailKey = (email) => {
  return email.replace(/[^a-zA-Z0-9]/g, "_");
};

const getSelectedTransactionKey = (email) => {
  return `selectedTransactionId_${getSafeEmailKey(email)}`;
};

const getSavedSelectedTransactionId = (email) => {
  const savedId = localStorage.getItem(getSelectedTransactionKey(email));

  if (savedId) {
    return Number(savedId);
  }

  return null;
};

function App() {
  const [currentUser, setCurrentUser] = useState(() => getSavedCurrentUser());
  const [activePage, setActivePage] = useState("dashboard");

  const [transactions, setTransactions] = useState([]);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [partyPayments, setPartyPayments] = useState([]);

  const [selectedTransactionId, setSelectedTransactionId] = useState(() => {
    const savedUser = getSavedCurrentUser();

    if (savedUser?.email) {
      return getSavedSelectedTransactionId(savedUser.email);
    }

    return null;
  });

  useEffect(() => {
    const loadProductsFromSupabase = async () => {
      if (!currentUser?.id) {
        setProducts([]);
        return;
      }

      const { data, error } = await fetchProducts(currentUser.id);

      if (error) {
        console.error("Fetch products error:", error);
        alert("خطا در دریافت کالاها و خدمات از سرور");
        return;
      }

      setProducts(data);
    };

    loadProductsFromSupabase();
  }, [currentUser]);

  useEffect(() => {
    const loadPartiesFromSupabase = async () => {
      if (!currentUser?.id) {
        setParties([]);
        return;
      }

      const { data, error } = await fetchParties(currentUser.id);

      if (error) {
        console.error("Fetch parties error:", error);
        alert("خطا در دریافت طرف حساب‌ها از سرور");
        return;
      }

      setParties(data);
    };

    loadPartiesFromSupabase();
  }, [currentUser]);

  useEffect(() => {
    const loadTransactionsFromSupabase = async () => {
      if (!currentUser?.id) {
        setTransactions([]);
        return;
      }

      const { data, error } = await fetchTransactions(currentUser.id);

      if (error) {
        console.error("Fetch transactions error:", error);
        alert("خطا در دریافت تراکنش‌ها از سرور");
        return;
      }

      setTransactions(data);
    };

    loadTransactionsFromSupabase();
  }, [currentUser]);

  useEffect(() => {
    const loadSalesInvoicesFromSupabase = async () => {
      if (!currentUser?.id) {
        setSalesInvoices([]);
        return;
      }

      const { data, error } = await fetchSalesInvoices(currentUser.id);

      if (error) {
        console.error("Fetch sales invoices error:", error);
        alert("خطا در دریافت فاکتورهای فروش از سرور");
        return;
      }

      setSalesInvoices(data);
    };

    loadSalesInvoicesFromSupabase();
  }, [currentUser]);

  useEffect(() => {
    const loadPartyPaymentsFromSupabase = async () => {
      if (!currentUser?.id) {
        setPartyPayments([]);
        return;
      }

      const { data, error } = await fetchPartyPayments(currentUser.id);

      if (error) {
        console.error("Fetch party payments error:", error);
        alert("خطا در دریافت دریافت‌ها و پرداخت‌ها از سرور");
        return;
      }

      setPartyPayments(data);
    };

    loadPartyPaymentsFromSupabase();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.email && selectedTransactionId) {
      localStorage.setItem(
        getSelectedTransactionKey(currentUser.email),
        selectedTransactionId
      );
    }

    if (currentUser?.email && !selectedTransactionId) {
      localStorage.removeItem(getSelectedTransactionKey(currentUser.email));
    }
  }, [selectedTransactionId, currentUser]);

  const handleLogin = (user) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    setCurrentUser(user);
    setTransactions([]);
    setSelectedTransactionId(
      user?.email ? getSavedSelectedTransactionId(user.email) : null
    );
    setParties([]);
    setProducts([]);
    setSalesInvoices([]);
    setPartyPayments([]);
    setActivePage("dashboard");
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem(CURRENT_USER_KEY);

    setCurrentUser(null);
    setTransactions([]);
    setSelectedTransactionId(null);
    setParties([]);
    setProducts([]);
    setSalesInvoices([]);
    setPartyPayments([]);
    setActivePage("dashboard");
  };

  const selectedTransaction =
    transactions.find(
      (transaction) => String(transaction.id) === String(selectedTransactionId)
    ) ||
    transactions[0] ||
    null;

  const addTransaction = async (transaction) => {
    if (!currentUser?.id) {
      alert("برای ثبت تراکنش باید وارد حساب کاربری شوید");
      return;
    }

    const { data, error } = await insertTransaction(currentUser.id, {
      ...transaction,
      sourceType: "manual",
      sourceId: null,
    });

    if (error) {
      console.error("Insert transaction error:", error);
      alert("خطا در ثبت تراکنش");
      return;
    }

    setTransactions((prevTransactions) => [data, ...prevTransactions]);
    setSelectedTransactionId(data.id);
  };

  const deleteTransaction = async (id) => {
    const confirmDelete = window.confirm(
      "آیا مطمئن هستید که میخواهید این تراکنش حذف شود؟"
    );

    if (!confirmDelete) {
      return;
    }

    if (!currentUser?.id) {
      alert("برای حذف تراکنش باید وارد حساب کاربری شوید");
      return;
    }

    const { error } = await deleteTransactionRecord(currentUser.id, id);

    if (error) {
      console.error("Delete transaction error:", error);
      alert("خطا در حذف تراکنش");
      return;
    }

    setTransactions((prevTransactions) =>
      prevTransactions.filter((transaction) => transaction.id !== id)
    );

    if (String(selectedTransactionId) === String(id)) {
      setSelectedTransactionId(null);
    }
  };

  const clearTransactions = async () => {
    const confirmClear = window.confirm(
      "آیا مطمئن هستید که میخواهید همه تراکنش‌ها حذف شوند؟"
    );

    if (!confirmClear) {
      return;
    }

    if (!currentUser?.id) {
      alert("برای حذف تراکنش‌ها باید وارد حساب کاربری شوید");
      return;
    }

    const { error } = await clearTransactionRecords(currentUser.id);

    if (error) {
      console.error("Clear transactions error:", error);
      alert("خطا در حذف همه تراکنش‌ها");
      return;
    }

    setTransactions([]);
    setSelectedTransactionId(null);
  };

  const addPartyPayment = async (payment) => {
    if (!currentUser?.id) {
      alert("برای ثبت دریافت یا پرداخت باید وارد حساب کاربری شوید");
      return;
    }

    const { data, error } = await insertPartyPayment(currentUser.id, payment);

    if (error) {
      console.error("Insert party payment error:", error);
      alert("خطا در ثبت دریافت یا پرداخت");
      return;
    }

    setPartyPayments((prevPayments) => [data, ...prevPayments]);

    if (data.invoiceId && data.paymentType === "receive") {
      const relatedInvoice = salesInvoices.find(
        (invoice) => String(invoice.id) === String(data.invoiceId)
      );

      if (relatedInvoice) {
        const previousPaidAmount = partyPayments
          .filter(
            (item) =>
              String(item.invoiceId) === String(data.invoiceId) &&
              item.paymentType === "receive"
          )
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const totalPaid = previousPaidAmount + Number(data.amount || 0);

        const { data: updatedInvoice, error: settlementError } =
          await updateSalesInvoiceSettlement(
            currentUser.id,
            relatedInvoice.id,
            relatedInvoice.finalTotal,
            totalPaid
          );

        if (settlementError) {
          console.error("Update invoice settlement error:", settlementError);
          alert("دریافت ثبت شد، اما وضعیت تسویه فاکتور آپدیت نشد");
        }

        if (!settlementError && updatedInvoice) {
          setSalesInvoices((prevInvoices) =>
            prevInvoices.map((invoice) =>
              invoice.id === updatedInvoice.id ? updatedInvoice : invoice
            )
          );
        }
      }
    }

    const party = parties.find(
      (item) => String(item.id) === String(data.partyId)
    );

    const isReceive = data.paymentType === "receive";

    const { data: transactionData, error: transactionError } =
      await insertTransaction(currentUser.id, {
        title: `${isReceive ? "دریافت از" : "پرداخت به"} ${
          party?.name || "طرف حساب"
        }`,
        amount: Number(data.amount),
        type: isReceive ? "income" : "expense",
        date: data.paymentDate,
        sourceType: "party_payment",
        sourceId: data.id,
      });

    if (transactionError) {
      console.error("Insert party payment transaction error:", transactionError);
      alert("دریافت/پرداخت ثبت شد، اما تراکنش مالی آن ثبت نشد");
      return;
    }

    setTransactions((prevTransactions) => [
      transactionData,
      ...prevTransactions,
    ]);
    setSelectedTransactionId(transactionData.id);
  };

  const deletePartyPayment = async (paymentId) => {
    const confirmDelete = window.confirm(
      "آیا مطمئن هستید که میخواهید این دریافت یا پرداخت حذف شود؟"
    );

    if (!confirmDelete) {
      return;
    }

    if (!currentUser?.id) {
      alert("برای حذف دریافت یا پرداخت باید وارد حساب کاربری شوید");
      return;
    }

    const deletedPayment = partyPayments.find(
      (payment) => String(payment.id) === String(paymentId)
    );

    const { error } = await deletePartyPaymentRecord(currentUser.id, paymentId);

    if (error) {
      console.error("Delete party payment error:", error);
      alert("خطا در حذف دریافت یا پرداخت");
      return;
    }

    const linkedTransaction = transactions.find(
      (transaction) =>
        transaction.sourceType === "party_payment" &&
        String(transaction.sourceId) === String(paymentId)
    );

    if (linkedTransaction) {
      const { error: transactionDeleteError } = await deleteTransactionRecord(
        currentUser.id,
        linkedTransaction.id
      );

      if (transactionDeleteError) {
        console.error("Delete linked transaction error:", transactionDeleteError);
      }
    }

    if (
      deletedPayment?.invoiceId &&
      deletedPayment.paymentType === "receive"
    ) {
      const relatedInvoice = salesInvoices.find(
        (invoice) => String(invoice.id) === String(deletedPayment.invoiceId)
      );

      if (relatedInvoice) {
        const totalPaidAfterDelete = partyPayments
          .filter(
            (item) =>
              String(item.invoiceId) === String(deletedPayment.invoiceId) &&
              String(item.id) !== String(paymentId) &&
              item.paymentType === "receive"
          )
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const { data: updatedInvoice, error: settlementError } =
          await updateSalesInvoiceSettlement(
            currentUser.id,
            relatedInvoice.id,
            relatedInvoice.finalTotal,
            totalPaidAfterDelete
          );

        if (settlementError) {
          console.error("Update invoice settlement after delete error:", settlementError);
          alert("دریافت حذف شد، اما وضعیت تسویه فاکتور آپدیت نشد");
        }

        if (!settlementError && updatedInvoice) {
          setSalesInvoices((prevInvoices) =>
            prevInvoices.map((invoice) =>
              invoice.id === updatedInvoice.id ? updatedInvoice : invoice
            )
          );
        }
      }
    }

    setPartyPayments((prevPayments) =>
      prevPayments.filter((payment) => String(payment.id) !== String(paymentId))
    );

    if (linkedTransaction) {
      setTransactions((prevTransactions) =>
        prevTransactions.filter(
          (transaction) =>
            String(transaction.id) !== String(linkedTransaction.id)
        )
      );

      if (String(selectedTransactionId) === String(linkedTransaction.id)) {
        setSelectedTransactionId(null);
      }
    }
  };

  const addParty = async (party) => {
    if (!currentUser?.id) {
      alert("برای ثبت طرف حساب باید وارد حساب کاربری شوید");
      return;
    }

    const { data, error } = await insertParty(currentUser.id, party);

    if (error) {
      console.error("Insert party error:", error);
      alert("خطا در ثبت طرف حساب");
      return;
    }

    setParties((prevParties) => [data, ...prevParties]);
  };

  const deleteParty = async (id) => {
    const confirmDelete = window.confirm(
      "آیا مطمئن هستید که میخواهید این طرف حساب حذف شود؟"
    );

    if (!confirmDelete) {
      return;
    }

    if (!currentUser?.id) {
      alert("برای حذف طرف حساب باید وارد حساب کاربری شوید");
      return;
    }

    const { error } = await deletePartyRecord(currentUser.id, id);

    if (error) {
      console.error("Delete party error:", error);
      alert("خطا در حذف طرف حساب");
      return;
    }

    setParties((prevParties) =>
      prevParties.filter((party) => party.id !== id)
    );
  };

  const updateParty = async (updatedParty) => {
    if (!currentUser?.id) {
      alert("برای ویرایش طرف حساب باید وارد حساب کاربری شوید");
      return;
    }

    const { data, error } = await updatePartyRecord(
      currentUser.id,
      updatedParty
    );

    if (error) {
      console.error("Update party error:", error);
      alert("خطا در ویرایش طرف حساب");
      return;
    }

    setParties((prevParties) =>
      prevParties.map((party) => (party.id === data.id ? data : party))
    );
  };

  const addProduct = async (product) => {
    if (!currentUser?.id) {
      alert("برای ثبت کالا یا خدمت باید وارد حساب کاربری شوید");
      return;
    }

    const { data, error } = await insertProduct(currentUser.id, product);

    if (error) {
      console.error("Insert product error:", error);
      alert("خطا در ثبت کالا یا خدمت");
      return;
    }

    setProducts((prevProducts) => [data, ...prevProducts]);
  };

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      "آیا مطمئن هستید که میخواهید این کالا یا خدمت حذف شود؟"
    );

    if (!confirmDelete) {
      return;
    }

    if (!currentUser?.id) {
      alert("برای حذف کالا یا خدمت باید وارد حساب کاربری شوید");
      return;
    }

    const { error } = await deleteProductRecord(currentUser.id, id);

    if (error) {
      console.error("Delete product error:", error);
      alert("خطا در حذف کالا یا خدمت");
      return;
    }

    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== id)
    );
  };

  const updateProduct = async (updatedProduct) => {
    if (!currentUser?.id) {
      alert("برای ویرایش کالا یا خدمت باید وارد حساب کاربری شوید");
      return;
    }

    const { data, error } = await updateProductRecord(
      currentUser.id,
      updatedProduct
    );

    if (error) {
      console.error("Update product error:", error);
      alert("خطا در ویرایش کالا یا خدمت");
      return;
    }

    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === data.id ? data : product
      )
    );
  };

  const createSalesInvoice = async (invoice) => {
    if (!currentUser?.id) {
      alert("برای ثبت فاکتور باید وارد حساب کاربری شوید");
      return;
    }

    const { data, error } = await insertSalesInvoice(currentUser.id, invoice);

    if (error) {
      console.error("Insert sales invoice error:", error);
      alert("خطا در ثبت فاکتور فروش");
      return;
    }

    setSalesInvoices((prevInvoices) => [data, ...prevInvoices]);

    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const invoiceRow = invoice.rows.find(
          (row) => String(row.productId) === String(product.id)
        );

        if (!invoiceRow || product.type === "service") {
          return product;
        }

        return {
          ...product,
          stock: Math.max(
            Number(product.stock) - Number(invoiceRow.quantity),
            0
          ),
        };
      })
    );

    const { data: transactionData, error: transactionError } =
      await insertTransaction(currentUser.id, {
        title: `فروش - ${data.invoiceNumber}`,
        amount: Number(data.finalTotal),
        type: "income",
        date: data.createdAt,
        sourceType: "sales_invoice",
        sourceId: data.id,
      });

    if (transactionError) {
      console.error("Insert sales transaction error:", transactionError);
      alert("فاکتور ثبت شد، اما تراکنش مالی آن ثبت نشد");
      return;
    }

    setTransactions((prevTransactions) => [
      transactionData,
      ...prevTransactions,
    ]);
    setSelectedTransactionId(transactionData.id);
  };

  const goToDashboard = () => {
    setActivePage("dashboard");
  };

  const renderPage = () => {
    if (activePage === "dashboard") {
      return (
        <>
          <Balance transactions={transactions} />
          <Summary transactions={transactions} />
          <Chart transactions={transactions} />
          <ManagementReport transactions={transactions} />
        </>
      );
    }

    if (activePage === "cash") {
      return (
        <>
          <TransactionForm addTransaction={addTransaction} />

          <TransactionList
            transactions={transactions}
            onSelectTransaction={setSelectedTransactionId}
            onDeleteTransaction={deleteTransaction}
            onClearTransactions={clearTransactions}
          />

          <Invoice transaction={selectedTransaction} />
        </>
      );
    }

    if (activePage === "sales") {
      return (
        <SalesInvoicePage
          parties={parties}
          products={products}
          salesInvoices={salesInvoices}
          onCreateSalesInvoice={createSalesInvoice}
        />
      );
    }

    if (activePage === "products") {
      return (
        <ProductsPage
          products={products}
          onAddProduct={addProduct}
          onDeleteProduct={deleteProduct}
          onUpdateProduct={updateProduct}
        />
      );
    }

    if (activePage === "customers") {
      return (
        <CustomersPage
          parties={parties}
          onAddParty={addParty}
          onDeleteParty={deleteParty}
          onUpdateParty={updateParty}
        />
      );
    }

    if (activePage === "ledger") {
      return (
        <CustomerLedgerPage
          parties={parties}
          salesInvoices={salesInvoices}
          partyPayments={partyPayments}
          onAddPartyPayment={addPartyPayment}
          onDeletePartyPayment={deletePartyPayment}
          onBack={goToDashboard}
        />
      );
    }

    if (activePage === "reports") {
      return (
        <ReportsPage
          transactions={transactions}
          parties={parties}
          products={products}
          salesInvoices={salesInvoices}
          onBack={goToDashboard}
        />
      );
    }

    return null;
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <main className="app">
      <Header currentUser={currentUser} onLogout={handleLogout} />

      <div className="app-shell">
        <MainMenu activePage={activePage} onChangePage={setActivePage} />

        <section className="app-content">{renderPage()}</section>
      </div>
    </main>
  );
}

export default App;