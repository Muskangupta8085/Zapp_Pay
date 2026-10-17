import React, { useState, useEffect } from 'react';
import { Search, Download, ChevronDown, X, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api/adminApi';


interface OrderItem {
  id: number;
  orderId: string;
  user: string;
  email?: string;
  type: 'Buy' | 'Sell';
  amount: string;
  rawAmount?: number;
  xcoin: string;
  price: string;
  status: 'Completed' | 'Pending' | 'Processing' | 'Failed' | 'Cancelled';
  dateTime: string;
  rawDate?: string;
}

export const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'Buy' | 'Sell'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, buy: 0, sell: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminApi.listOrders(activeTab, statusFilter, searchQuery);
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, statusFilter]);

  // Handle Search submit / debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('No orders to export');
      return;
    }

    const headers = ['Order ID', 'User', 'Type', 'Amount (INR)', 'xCoin', 'Price (INR)', 'Status', 'Date & Time'];
    const rows = orders.map((o) => [
      o.orderId,
      o.user,
      o.type,
      o.amount.replace(/₹|,/g, '').trim(),
      o.xcoin,
      o.price.replace(/₹|,/g, '').trim(),
      o.status,
      o.dateTime,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusList = ['All', 'Completed', 'Pending', 'Failed', 'Cancelled'];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.4px', margin: 0 }}>
            Orders & Trade Execution
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', fontWeight: '500', margin: '4px 0 0' }}>
            Manage real-time buy and sell orders from active trading pairs.
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchOrders}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Pill Filter Tabs with Dynamic Database Counts */}
      <div className="filter-tabs-bar">
        <button
          className={`filter-pill ${activeTab === 'All' ? 'active' : ''}`}
          onClick={() => setActiveTab('All')}
        >
          All Orders ({counts.total})
        </button>
        <button
          className={`filter-pill ${activeTab === 'Buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('Buy')}
        >
          Buy Orders ({counts.buy})
        </button>
        <button
          className={`filter-pill ${activeTab === 'Sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('Sell')}
        >
          Sell Orders ({counts.sell})
        </button>
      </div>

      {/* Filter Toolbar Card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search by order ID, user name, email..."
              className="form-input"
              style={{ paddingLeft: '38px', height: '40px', fontSize: '13px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
            {/* Status Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ height: '40px', fontWeight: '700' }}
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <span>{statusFilter === 'All' ? 'All Status' : statusFilter}</span>
                <ChevronDown size={14} color="#94A3B8" />
              </button>

              {showStatusDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '160px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    border: '1px solid #E2E8F0',
                    zIndex: 50,
                    overflow: 'hidden',
                  }}
                >
                  {statusList.map((st) => (
                    <div
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setShowStatusDropdown(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        fontSize: '13px',
                        fontWeight: statusFilter === st ? '800' : '600',
                        color: statusFilter === st ? '#2563EB' : '#334155',
                        backgroundColor: statusFilter === st ? '#EFF6FF' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {st === 'All' ? 'All Status' : st}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn btn-secondary btn-sm"
              style={{ height: '40px', fontWeight: '700' }}
              onClick={handleExportCSV}
            >
              <Download size={14} color="#64748B" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Order ID</th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>xCoin</th>
              <th>Price</th>
              <th>Status</th>
              <th>Date & Time</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={24} className="animate-spin" color="#2563EB" />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Loading orders...</span>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '700', color: '#475569', margin: 0 }}>
                        No orders found
                      </p>
                      <p style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px' }}>
                        {searchQuery ? `No results matching "${searchQuery}"` : 'There are no active orders matching this criteria.'}
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              orders.map((o, index) => (
                <tr key={o.orderId || index}>
                  <td style={{ color: '#94A3B8', fontWeight: '700' }}>{index + 1}</td>
                  <td>
                    <span style={{ fontWeight: '800', color: '#0F172A' }}>{o.orderId}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', color: '#334155' }}>{o.user}</div>
                    {o.email && <div style={{ fontSize: '11px', color: '#94A3B8' }}>{o.email}</div>}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        backgroundColor: o.type === 'Buy' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(225, 29, 72, 0.1)',
                        color: o.type === 'Buy' ? '#2563EB' : '#E11D48',
                      }}
                    >
                      {o.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: '800', color: '#0F172A' }}>
                    {o.amount}
                  </td>
                  <td style={{ fontWeight: '800', color: '#2563EB' }}>
                    {o.xcoin}
                  </td>
                  <td style={{ color: '#64748B', fontWeight: '600' }}>
                    {o.price}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        o.status === 'Completed'
                          ? 'badge-emerald'
                          : o.status === 'Pending'
                          ? 'badge-amber'
                          : o.status === 'Failed'
                          ? 'badge-rose'
                          : 'badge-muted'
                      }`}
                      style={{ fontSize: '11px' }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td style={{ color: '#64748B', fontSize: '12.5px', fontWeight: '600' }}>
                    {o.dateTime}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '12px', color: '#2563EB', fontWeight: '700' }}
                      onClick={() => setSelectedOrder(o)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                  Order Details
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                  {selectedOrder.orderId}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>TRADER</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{selectedOrder.user}</div>
                  {selectedOrder.email && <div style={{ fontSize: '11.5px', color: '#64748B' }}>{selectedOrder.email}</div>}
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>ORDER TYPE</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: selectedOrder.type === 'Buy' ? '#2563EB' : '#E11D48', marginTop: '2px' }}>
                    {selectedOrder.type} Order
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>FIAT AMOUNT</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', marginTop: '2px' }}>{selectedOrder.amount}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>QUANTITY</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#2563EB', marginTop: '2px' }}>{selectedOrder.xcoin} xCoin</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>EXECUTION PRICE</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>{selectedOrder.price} / coin</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>STATUS</div>
                  <div style={{ marginTop: '2px' }}>
                    <span className={`badge ${selectedOrder.status === 'Completed' ? 'badge-emerald' : selectedOrder.status === 'Pending' ? 'badge-amber' : 'badge-rose'}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                <span>Timestamp:</span>
                <span style={{ fontWeight: '700', color: '#0F172A' }}>{selectedOrder.dateTime}</span>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setSelectedOrder(null)}
                style={{ width: '100%', marginTop: '8px', fontWeight: '800' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
