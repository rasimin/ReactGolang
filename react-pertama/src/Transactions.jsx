const React = window.React;
import Pagination from './Pagination.jsx';
import SearchInput from './SearchInput.jsx';
import CustomSelect from './CustomSelect.jsx';
const { useState, useEffect } = React;

export default function Transactions({ showToast }) {
  const [transactions, setTransactions] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Mock Data
  useEffect(() => {
    setTimeout(() => {
      // Workspaces for filter
      const mockWorkspaces = [
        { id: 1, name: 'PT. Maju Jaya' },
        { id: 2, name: 'CV. Berkah Abadi' },
        { id: 3, name: 'Global Tech Solutions' },
        { id: 4, name: 'Indo Food Corp' },
        { id: 5, name: 'Logistik Cepat' }
      ];
      setWorkspaces(mockWorkspaces);

      // Transactions
      const mockTransactions = [
        { id: 101, workspaceId: 1, date: '2025-01-25', refNo: 'TRX-001', amount: 1500000, status: 'completed', description: 'Monthly Subscription', createdBy: 'Admin' },
        { id: 102, workspaceId: 1, date: '2025-01-26', refNo: 'TRX-002', amount: 500000, status: 'pending', description: 'Add-on Service', createdBy: 'Admin' },
        { id: 103, workspaceId: 2, date: '2025-01-24', refNo: 'TRX-003', amount: 2000000, status: 'completed', description: 'Annual License', createdBy: 'Sales' },
        { id: 104, workspaceId: 3, date: '2025-01-23', refNo: 'TRX-004', amount: 750000, status: 'failed', description: 'Consulting Fee', createdBy: 'System' },
        { id: 105, workspaceId: 4, date: '2025-01-25', refNo: 'TRX-005', amount: 3000000, status: 'completed', description: 'Bulk Order', createdBy: 'Admin' },
        { id: 106, workspaceId: 5, date: '2025-01-22', refNo: 'TRX-006', amount: 1200000, status: 'cancelled', description: 'Logistics Service', createdBy: 'User' },
      ];
      setTransactions(mockTransactions);
      setLoading(false);
    }, 800);
  }, []);

  // Filter Logic
  const filteredTransactions = transactions.filter(trx => 
    (workspaceFilter === 'all' || trx.workspaceId === parseInt(workspaceFilter)) &&
    (trx.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
     trx.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => setCurrentPage(page);
  
  const getWorkspaceName = (id) => workspaces.find(w => w.id === id)?.name || 'Unknown';

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
      cancelled: 'secondary'
    };
    const color = colors[status] || 'primary';
    return React.createElement('span', { className: `badge bg-${color} bg-opacity-10 text-${color}` }, status.charAt(0).toUpperCase() + status.slice(1));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return React.createElement('div', { className: 'modern-card p-4 animate-fade-in' }, [
    // Header
    React.createElement('div', { key: 'header', className: 'd-flex flex-wrap gap-3 justify-content-between align-items-center mb-4' }, [
      React.createElement('h5', { key: 'title', className: 'fw-bold mb-0' }, 'Transactions'),
      React.createElement('div', { key: 'actions', className: 'd-flex gap-3 align-items-center' }, [
        React.createElement(SearchInput, {
          key: 'search',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          placeholder: 'Search ref or desc...',
          isLoading: loading
        }),
        React.createElement(CustomSelect, {
          key: 'ws-filter',
          className: 'w-auto',
          style: { minWidth: '150px' },
          value: workspaceFilter,
          compact: true,
          options: [
            { value: 'all', label: 'All Clients' },
            ...workspaces.map(ws => ({ value: ws.id, label: ws.name }))
          ],
          placeholder: 'All Clients',
          onChange: (val) => setWorkspaceFilter(val)
        })
      ])
    ]),

    // Table
    React.createElement('div', { key: 'table-responsive', className: 'table-responsive position-relative' }, [
      loading && React.createElement('div', { 
        key: 'loading',
        className: 'table-loading-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center',
        style: { zIndex: 5 }
      }, [
        React.createElement('div', { key: 'spinner', className: 'spinner-border text-primary mb-2', role: 'status', style: { width: '3rem', height: '3rem' } }),
        React.createElement('div', { key: 'text', className: 'text-primary fw-bold small tracking-wider' }, 'LOADING DATA...')
      ]),
      
      React.createElement('table', { className: 'table table-modern table-hover align-middle' }, [
        React.createElement('thead', { key: 'thead' }, 
          React.createElement('tr', null, [
            React.createElement('th', { key: 'th-ref' }, 'REF NO'),
            React.createElement('th', { key: 'th-date' }, 'DATE'),
            React.createElement('th', { key: 'th-client' }, 'CLIENT'),
            React.createElement('th', { key: 'th-desc' }, 'DESCRIPTION'),
            React.createElement('th', { key: 'th-amount' }, 'AMOUNT'),
            React.createElement('th', { key: 'th-status' }, 'STATUS'),
            React.createElement('th', { key: 'th-created' }, 'CREATED BY')
          ])
        ),
        React.createElement('tbody', { key: 'tbody' }, 
          currentItems.length > 0 ? currentItems.map(trx => 
            React.createElement('tr', { key: trx.id }, [
              React.createElement('td', { key: 'ref' }, 
                React.createElement('span', { className: 'font-monospace small bg-light text-dark px-2 py-1 rounded border' }, trx.refNo)
              ),
              React.createElement('td', { key: 'date' }, trx.date),
              React.createElement('td', { key: 'client' }, 
                React.createElement('div', { className: 'd-flex align-items-center' }, [
                  React.createElement('i', { className: 'fa-solid fa-building text-muted me-2 small' }),
                  getWorkspaceName(trx.workspaceId)
                ])
              ),
              React.createElement('td', { key: 'desc' }, trx.description),
              React.createElement('td', { key: 'amount', className: 'fw-bold' }, formatCurrency(trx.amount)),
              React.createElement('td', { key: 'status' }, getStatusBadge(trx.status)),
              React.createElement('td', { key: 'created', className: 'text-muted small' }, trx.createdBy)
            ])
          ) : React.createElement('tr', null, 
            React.createElement('td', { colSpan: 7, className: 'text-center py-5 text-muted' }, 'No transactions found')
          )
        )
      ])
    ]),

    // Pagination
    React.createElement(Pagination, {
      key: 'pagination',
      currentPage: currentPage,
      totalPages: totalPages,
      onPageChange: handlePageChange,
      totalItems: filteredTransactions.length,
      indexOfFirstItem: indexOfFirstItem,
      indexOfLastItem: indexOfLastItem
    })
  ]);
}
