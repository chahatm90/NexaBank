import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/common/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import CreateCustomer from './pages/CreateCustomer.jsx';
import Accounts from './pages/Accounts.jsx';
import CreateAccount from './pages/CreateAccount.jsx';
import Transactions from './pages/Transactions.jsx';
import Transfer from './pages/Transfer.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#131d35',
            color: '#e8edf5',
            border: '1px solid #1e2d4a',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#131d35' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#131d35' } },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<CreateCustomer />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/new" element={<CreateAccount />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transfer" element={<Transfer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
