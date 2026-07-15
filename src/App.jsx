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

const getTransactionsKey = (email) => {
  return `transactions_${getSafeEmailKey(email)}`;
};

const getSelectedTransactionKey = (email) => {
  return `selectedTransactionId_${getSafeEmailKey(email)}`;
};

const getPartiesKey = (email) => {
  return `parties_${getSafeEmailKey(email)}`;
};

const getProductsKey = (email) => {
  return `products_${getSafeEmailKey(email)}`;
};

const getSalesInvoicesKey = (email) => {
  return `salesInvoices_${getSafeEmailKey(email)}`;
};

const getSavedTransactions = (email) => {
  const savedTransactions = localStorage.getItem(getTransactionsKey(email));

  if (savedTransactions) {
    try {
      return JSON.parse(savedTransactions);
    } catch {
      return [];
    }
  }

  return [];
};

const getSavedSelectedTransactionId = (email) => {
  const savedId = localStorage.getItem(getSelectedTransactionKey(email));

  if (savedId) {
    return Number(savedId);
  }

  return null;
};

const getSavedParties = (email) => {
  const savedParties = localStorage.getItem(getPartiesKey(email));

  if (savedParties) {
    try {
      return JSON.parse(savedParties);
    } catch {
      return [];
    }
  }

  return [];
};

const getSavedProducts = (email) => {
  const savedProducts = localStorage.getItem(getProductsKey(email));

  if (savedProducts) {
    try {
      return JSON.parse(savedProducts);
    } catch {
      return [];
    }
  }

  return [];
};

const getSavedSalesInvoices = (email) => {
  const savedInvoices = localStorage.getItem(getSalesInvoicesKey(email));

  if (savedInvoices) {
    try {
      return JSON.parse(savedInvoices);
    } catch {
      return [];
    }
  }

  return [];
};

function App() {
  const [currentUser, setCurrentUser] = useState(getSavedCurrentUser);
  const [activePage, setActivePage] = useState("dashboard");

  const [transactions, setTransactions] = useState(() => {
    const savedUser = getSavedCurrentUser();

    if (savedUser) {
      return getSavedTransactions(savedUser.email);
    }

    return [];
  });

  const [selectedTransactionId, setSelectedTransactionId] = useState(() => {
    const savedUser = getSavedCurrentUser();

    if (savedUser) {
      return getSavedSelectedTransactionId(savedUser.email);
    }

    return null;
  });

  const [parties, setParties] = useState(() => {
    const savedUser = getSavedCurrentUser();

    if (savedUser) {
      return getSavedParties(savedUser.email);
    }

    return [];
  });

  const [products, setProducts] = useState(() => {
    const savedUser = getSavedCurrentUser();

    if (savedUser) {
      return getSavedProducts(savedUser.email);
    }

    return [];
  });

  const [salesInvoices, setSalesInvoices] = useState(() => {
    const savedUser = getSavedCurrentUser();

    if (savedUser) {
      return getSavedSalesInvoices(savedUser.email);
    }

    return [];
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(
        getTransactionsKey(currentUser.email),
        JSON.stringify(transactions)
      );
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(
        getPartiesKey(currentUser.email),
        JSON.stringify(parties)
      );
    }
  }, [parties, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(
        getProductsKey(currentUser.email),
        JSON.stringify(products)
      );
    }
  }, [products, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(
        getSalesInvoicesKey(currentUser.email),
        JSON.stringify(salesInvoices)
      );
    }
  }, [salesInvoices, currentUser]);

  useEffect(() => {
    if (currentUser && selectedTransactionId) {
      localStorage.setItem(
        getSelectedTransactionKey(currentUser.email),
        selectedTransactionId
      );
    }

    if (currentUser && !selectedTransactionId) {
      localStorage.removeItem(getSelectedTransactionKey(currentUser.email));
    }
  }, [selectedTransactionId, currentUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setTransactions(getSavedTransactions(user.email));
    setSelectedTransactionId(getSavedSelectedTransactionId(user.email));
    setParties(getSavedParties(user.email));
    setProducts(getSavedProducts(user.email));
    setSalesInvoices(getSavedSalesInvoices(user.email));
    setActivePage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
    setTransactions([]);
    setSelectedTransactionId(null);
    setParties([]);
    setProducts([]);
    setSalesInvoices([]);
    setActivePage("dashboard");
  };

  const selectedTransaction =
    transactions.find(
      (transaction) => transaction.id === selectedTransactionId
    ) ||
    transactions[0] ||
    null;

  const addTransaction = (transaction) => {
    setTransactions((prevTransactions) => [transaction, ...prevTransactions]);
    setSelectedTransactionId(transaction.id);
  };

  const deleteTransaction = (id) => {
    setTransactions((prevTransactions) => {
      const newTransactions = prevTransactions.filter(
        (transaction) => transaction.id !== id
      );

      if (selectedTransactionId === id) {
        setSelectedTransactionId(newTransactions[0]?.id || null);
      }

      return newTransactions;
    });
  };

  const clearTransactions = () => {
    const confirmDelete = window.confirm(
      "آیا مطمئن هستید که میخواهید همه تراکنش ها را پاک کنید؟"
    );

    if (confirmDelete) {
      setTransactions([]);
      setSelectedTransactionId(null);

      if (currentUser) {
        localStorage.removeItem(getTransactionsKey(currentUser.email));
        localStorage.removeItem(getSelectedTransactionKey(currentUser.email));
      }
    }
  };

  const addParty = (party) => {
    setParties((prevParties) => [party, ...prevParties]);
  };

  const deleteParty = (id) => {
    const confirmDelete = window.confirm(
      "آیا مطمئن هستید که میخواهید این طرف حساب حذف شود؟"
    );

    if (confirmDelete) {
      setParties((prevParties) =>
        prevParties.filter((party) => party.id !== id)
      );
    }
  };

  const addProduct = (product) => {
    setProducts((prevProducts) => [product, ...prevProducts]);
  };

  const deleteProduct = (id) => {
    const confirmDelete = window.confirm(
      "آیا مطمئن هستید که میخواهید این کالا یا خدمت حذف شود؟"
    );

    if (confirmDelete) {
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== id)
      );
    }
  };
  const updateProduct = (updatedProduct) => {
  setProducts((prevProducts) =>
    prevProducts.map((product) =>
      product.id === updatedProduct.id ? updatedProduct : product
    )
  );
};
  const updateParty = (updatedParty) => {
  setParties((prevParties) =>
    prevParties.map((party) =>
      party.id === updatedParty.id ? updatedParty : party
    )
  );
};

  const createSalesInvoice = (invoice) => {
    setSalesInvoices((prevInvoices) => [invoice, ...prevInvoices]);

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

    const newTransaction = {
      id: Date.now() + 1,
      title: `فروش - ${invoice.invoiceNumber}`,
      amount: Number(invoice.finalTotal),
      type: "income",
      date: invoice.createdAt,
    };

    setTransactions((prevTransactions) => [newTransaction, ...prevTransactions]);
    setSelectedTransactionId(newTransaction.id);
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

        <section className="app-content">
          {renderPage()}
        </section>
      </div>
    </main>
  );
}

export default App;