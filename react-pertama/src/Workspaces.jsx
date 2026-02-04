const React = window.React;
import Pagination from './Pagination.jsx';
import SearchInput from './SearchInput.jsx';
import CustomSelect from './CustomSelect.jsx';
const { useState, useEffect } = React;

export default function Workspaces({ showToast }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  
  // History States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedWorkspaceForHistory, setSelectedWorkspaceForHistory] = useState(null);

  const [currentWorkspace, setCurrentWorkspace] = useState({
    id: 0,
    name: '',
    code: '',
    description: '',
    status: 'active',
    contactEmail: '',
    address: ''
  });

  // Mock Data Initialization
  useEffect(() => {
    // Simulating API call
    setTimeout(() => {
      const mockData = [
        { id: 1, name: 'PT. Maju Jaya', code: 'MJ001', description: 'Retail Client', status: 'active', contactEmail: 'contact@majujaya.com', address: 'Jl. Sudirman No. 1, Jakarta', createdAt: '2025-01-10' },
        { id: 2, name: 'CV. Berkah Abadi', code: 'BA002', description: 'Distributor Electronics', status: 'active', contactEmail: 'info@berkahabadi.com', address: 'Jl. Ahmad Yani No. 45, Surabaya', createdAt: '2025-01-12' },
        { id: 3, name: 'Global Tech Solutions', code: 'GTS03', description: 'Software House', status: 'inactive', contactEmail: 'support@gts.io', address: 'Tech Park Blk A, Bandung', createdAt: '2025-01-15' },
        { id: 4, name: 'Indo Food Corp', code: 'IFC04', description: 'F&B Enterprise', status: 'active', contactEmail: 'procurement@indofood.co.id', address: 'Kawasan Industri Pulogadung', createdAt: '2025-01-20' },
        { id: 5, name: 'Logistik Cepat', code: 'LC005', description: 'Logistics Partner', status: 'active', contactEmail: 'ops@logistikcepat.id', address: 'Jl. Soekarno Hatta, Makassar', createdAt: '2025-01-22' }
      ];
      setWorkspaces(mockData);
      setLoading(false);
    }, 800);
  }, []);

  // Filter Logic
  const filteredWorkspaces = workspaces.filter(ws => 
    (statusFilter === 'all' || ws.status === statusFilter) &&
    (ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ws.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredWorkspaces.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredWorkspaces.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => setCurrentPage(page);

  // Modal Handlers
  const openAddModal = () => {
    setModalMode('add');
    setCurrentWorkspace({ id: 0, name: '', code: '', description: '', status: 'active', contactEmail: '', address: '' });
    setShowModal(true);
  };

  const openEditModal = (ws) => {
    setModalMode('edit');
    setCurrentWorkspace({ ...ws });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!currentWorkspace.name || !currentWorkspace.code) {
      if (showToast) showToast('Name and Code are required', 'error');
      else alert('Name and Code are required');
      return;
    }

    if (modalMode === 'add') {
      const newId = Math.max(...workspaces.map(w => w.id), 0) + 1;
      const newWorkspace = { 
        ...currentWorkspace, 
        id: newId, 
        createdAt: new Date().toISOString().split('T')[0] 
      };
      setWorkspaces([...workspaces, newWorkspace]);
      if (showToast) showToast('Workspace added successfully', 'success');
    } else {
      setWorkspaces(workspaces.map(w => w.id === currentWorkspace.id ? currentWorkspace : w));
      if (showToast) showToast('Workspace updated successfully', 'success');
    }
    setShowModal(false);
  };

  // Delete Handlers
  const handleDelete = (ws) => {
    setWorkspaceToDelete(ws);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (workspaceToDelete) {
      setWorkspaces(workspaces.filter(w => w.id !== workspaceToDelete.id));
      if (showToast) showToast('Workspace deleted successfully', 'success');
      setShowDeleteModal(false);
      setWorkspaceToDelete(null);
    }
  };

  // History Handlers
  const handleViewHistory = (ws) => {
    setSelectedWorkspaceForHistory(ws);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    
    // Simulating API fetch for history
    setTimeout(() => {
      setHistoryData([
        { date: '2025-01-20 10:00', action: 'Updated Status', user: 'Admin', details: 'Active -> Inactive' },
        { date: '2025-01-15 14:30', action: 'Updated Info', user: 'Manager', details: 'Changed address' },
        { date: '2025-01-10 09:00', action: 'Created', user: 'System', details: 'Initial creation' }
      ]);
      setHistoryLoading(false);
    }, 600);
  };

  return React.createElement('div', { className: 'modern-card p-4 animate-fade-in' }, [
    // Header
    React.createElement('div', { key: 'header', className: 'd-flex flex-wrap gap-3 justify-content-between align-items-center mb-4' }, [
      React.createElement('h5', { key: 'title', className: 'fw-bold mb-0' }, 'Workspace Management'),
      React.createElement('div', { key: 'actions', className: 'd-flex gap-3 align-items-center' }, [
        React.createElement(SearchInput, {
          key: 'search',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          placeholder: 'Search workspaces...',
          isLoading: loading
        }),
        React.createElement(CustomSelect, {
          key: 'status-filter',
          className: 'w-auto',
          style: { minWidth: '140px' },
          value: statusFilter,
          compact: true,
          options: [
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ],
          placeholder: 'All Status',
          onChange: (val) => setStatusFilter(val)
        }),
        React.createElement('button', { className: 'btn-add-modern', onClick: openAddModal }, [
          React.createElement('i', { key: 'icon', className: 'fa-solid fa-plus' }),
          'Add Workspace'
        ])
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
            React.createElement('th', { key: 'th-name' }, 'WORKSPACE NAME'),
            React.createElement('th', { key: 'th-code' }, 'CODE'),
            React.createElement('th', { key: 'th-desc' }, 'DESCRIPTION'),
            React.createElement('th', { key: 'th-status' }, 'STATUS'),
            React.createElement('th', { key: 'th-contact' }, 'CONTACT'),
            React.createElement('th', { key: 'th-actions', className: 'text-end' }, 'ACTIONS')
          ])
        ),
        React.createElement('tbody', { key: 'tbody' }, 
          currentItems.length > 0 ? currentItems.map(ws => 
            React.createElement('tr', { key: ws.id }, [
              React.createElement('td', { key: 'name' }, 
                React.createElement('div', { className: 'd-flex align-items-center' }, [
                  React.createElement('div', { className: 'rounded-circle bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center me-3', style: { width: '32px', height: '32px' } },
                    React.createElement('i', { className: 'fa-solid fa-building small' })
                  ),
                  React.createElement('div', null, [
                    React.createElement('div', { className: 'fw-medium' }, ws.name),
                    React.createElement('small', { className: 'text-muted' }, `ID: ${ws.id}`)
                  ])
                ])
              ),
              React.createElement('td', { key: 'code' }, 
                React.createElement('span', { className: 'font-monospace small bg-light text-dark px-2 py-1 rounded border' }, ws.code)
              ),
              React.createElement('td', { key: 'desc', className: 'text-muted small' }, ws.description),
              React.createElement('td', { key: 'status' }, 
                ws.status === 'active' 
                  ? React.createElement('span', { className: 'badge bg-success bg-opacity-10 text-success' }, 'Active')
                  : React.createElement('span', { className: 'badge bg-danger bg-opacity-10 text-danger' }, 'Inactive')
              ),
              React.createElement('td', { key: 'contact' }, 
                React.createElement('div', { className: 'd-flex flex-column small' }, [
                  React.createElement('span', null, ws.contactEmail),
                  React.createElement('span', { className: 'text-muted' }, ws.address)
                ])
              ),
              React.createElement('td', { key: 'actions', className: 'text-end' }, 
                React.createElement('div', { className: 'd-flex justify-content-end gap-2' }, [
                  React.createElement('button', { 
                    key: 'edit',
                    className: 'btn btn-sm btn-link text-primary',
                    title: 'Edit Workspace',
                    onClick: () => openEditModal(ws)
                  }, React.createElement('i', { className: 'fa-solid fa-pen-to-square' })),
                  React.createElement('button', { 
                    key: 'history',
                    className: 'btn btn-sm btn-link text-info',
                    title: 'View History',
                    onClick: () => handleViewHistory(ws)
                  }, React.createElement('i', { className: 'fa-solid fa-clock-rotate-left' })),
                  React.createElement('button', { 
                    key: 'delete',
                    className: 'btn btn-sm btn-link text-danger',
                    title: 'Delete Workspace',
                    onClick: () => handleDelete(ws)
                  }, React.createElement('i', { className: 'fa-solid fa-trash' }))
                ])
              )
            ])
          ) : React.createElement('tr', null, 
            React.createElement('td', { colSpan: 6, className: 'text-center py-5 text-muted' }, 'No workspaces found')
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
      totalItems: filteredWorkspaces.length,
      indexOfFirstItem: indexOfFirstItem,
      indexOfLastItem: indexOfLastItem
    }),

    // Add/Edit Modal
    showModal && window.ReactDOM.createPortal(
      React.createElement('div', { className: 'modal fade show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 } },
        React.createElement('div', { className: 'modal-dialog modal-dialog-centered' },
          React.createElement('div', { className: 'modal-content modern-card border-0 shadow-lg' }, [
            React.createElement('div', { key: 'header', className: 'modal-header border-0 pb-0' },
              React.createElement('h5', { className: 'modal-title fw-bold' }, modalMode === 'add' ? 'Add New Workspace' : 'Edit Workspace'),
              React.createElement('button', { type: 'button', className: 'btn-close', onClick: () => setShowModal(false) })
            ),
            React.createElement('div', { key: 'body', className: 'modal-body' }, [
              React.createElement('div', { className: 'mb-3' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Workspace Name'),
                React.createElement('input', { 
                  type: 'text', 
                  className: 'form-control form-control-modern', 
                  value: currentWorkspace.name,
                  onChange: (e) => setCurrentWorkspace({ ...currentWorkspace, name: e.target.value }),
                  placeholder: 'e.g., PT. Maju Jaya'
                })
              ]),
              React.createElement('div', { className: 'row' }, [
                React.createElement('div', { className: 'col-md-6 mb-3' }, [
                  React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Code'),
                  React.createElement('input', { 
                    type: 'text', 
                    className: 'form-control form-control-modern font-monospace', 
                    value: currentWorkspace.code,
                    onChange: (e) => setCurrentWorkspace({ ...currentWorkspace, code: e.target.value.toUpperCase() }),
                    placeholder: 'e.g., MJ001'
                  })
                ]),
                React.createElement('div', { className: 'col-md-6 mb-3' }, [
                  React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Status'),
                React.createElement(CustomSelect, {
                    className: 'w-100',
                    value: currentWorkspace.status,
                    options: [
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                    ],
                    placeholder: 'Select Status',
                    onChange: (val) => setCurrentWorkspace({ ...currentWorkspace, status: val })
                })
              ])
              ]),
              React.createElement('div', { className: 'mb-3' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Description'),
                React.createElement('textarea', { 
                  className: 'form-control form-control-modern', 
                  rows: 2,
                  value: currentWorkspace.description,
                  onChange: (e) => setCurrentWorkspace({ ...currentWorkspace, description: e.target.value })
                })
              ]),
              React.createElement('div', { className: 'mb-3' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Contact Email'),
                React.createElement('input', { 
                  type: 'email', 
                  className: 'form-control form-control-modern', 
                  value: currentWorkspace.contactEmail,
                  onChange: (e) => setCurrentWorkspace({ ...currentWorkspace, contactEmail: e.target.value })
                })
              ]),
              React.createElement('div', { className: 'mb-3' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Address'),
                React.createElement('textarea', { 
                  className: 'form-control form-control-modern', 
                  rows: 2,
                  value: currentWorkspace.address,
                  onChange: (e) => setCurrentWorkspace({ ...currentWorkspace, address: e.target.value })
                })
              ])
            ]),
            React.createElement('div', { key: 'footer', className: 'modal-footer border-0 pt-0' }, [
              React.createElement('button', { type: 'button', className: 'btn btn-modern-light', onClick: () => setShowModal(false) }, 'Cancel'),
              React.createElement('button', { type: 'button', className: 'btn btn-primary', onClick: handleSave }, 'Save Changes')
            ])
          ])
        )
      ), document.body
    ),

    // Delete Confirmation Modal
    showDeleteModal && window.ReactDOM.createPortal(
      React.createElement('div', { className: 'modal fade show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 } },
        React.createElement('div', { className: 'modal-dialog modal-dialog-centered modal-sm' },
          React.createElement('div', { className: 'modal-content modern-card border-0 shadow-lg' }, [
            React.createElement('div', { className: 'modal-body text-center p-4' }, [
              React.createElement('div', { className: 'mb-3 text-danger' }, 
                React.createElement('i', { className: 'fa-solid fa-triangle-exclamation fa-3x' })
              ),
              React.createElement('h5', { className: 'fw-bold mb-2' }, 'Delete Workspace?'),
              React.createElement('p', { className: 'text-muted small mb-4' }, 
                `Are you sure you want to delete "${workspaceToDelete?.name}"? This action cannot be undone.`
              ),
              React.createElement('div', { className: 'd-flex gap-2 justify-content-center' }, [
                React.createElement('button', { 
                  className: 'btn btn-modern-light w-50', 
                  onClick: () => setShowDeleteModal(false) 
                }, 'Cancel'),
                React.createElement('button', { 
                  className: 'btn btn-danger w-50', 
                  onClick: confirmDelete 
                }, 'Delete')
              ])
            ])
          ])
        )
      ), document.body
    ),

    // History Modal
    showHistoryModal && window.ReactDOM.createPortal(
      React.createElement('div', { className: 'modal fade show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 } },
        React.createElement('div', { className: 'modal-dialog modal-dialog-centered' },
          React.createElement('div', { className: 'modal-content modern-card border-0 shadow-lg' }, [
            React.createElement('div', { key: 'header', className: 'modal-header border-0 pb-0' },
              React.createElement('h5', { className: 'modal-title fw-bold' }, `History: ${selectedWorkspaceForHistory?.code}`),
              React.createElement('button', { type: 'button', className: 'btn-close', onClick: () => setShowHistoryModal(false) })
            ),
            React.createElement('div', { key: 'body', className: 'modal-body p-0' }, [
              historyLoading 
                ? React.createElement('div', { className: 'p-5 text-center' }, 
                    React.createElement('div', { className: 'spinner-border text-primary' })
                  )
                : React.createElement('div', { className: 'list-group list-group-flush' }, 
                    historyData.length > 0 ? historyData.map((item, idx) => 
                      React.createElement('div', { key: idx, className: 'list-group-item bg-transparent p-3 border-light' }, [
                        React.createElement('div', { className: 'd-flex justify-content-between mb-1' }, [
                          React.createElement('small', { className: 'fw-bold' }, item.action),
                          React.createElement('small', { className: 'text-muted' }, item.date)
                        ]),
                        React.createElement('p', { className: 'mb-1 small text-muted' }, item.details),
                        React.createElement('small', { className: 'text-primary' }, `By: ${item.user}`)
                      ])
                    ) : React.createElement('div', { className: 'p-4 text-center text-muted' }, 'No history available')
                  )
            ]),
            React.createElement('div', { key: 'footer', className: 'modal-footer border-0' }, 
              React.createElement('button', { type: 'button', className: 'btn btn-modern-light', onClick: () => setShowHistoryModal(false) }, 'Close')
            )
          ])
        )
      ), document.body
    )
  ]);
}
