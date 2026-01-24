const React = window.React;
const ReactDOM = window.ReactDOM;
import config from './config.js';
const { useState, useEffect } = React;

export default function Config({ showToast }) {
  const [configs, setConfigs] = useState([]);
  const [totalConfigs, setTotalConfigs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Current Config State
  const [currentConfig, setCurrentConfig] = useState({
    id: 0,
    configKey: '',
    dataType: 'string',
    mainValue: '',
    alternativeValue: '',
    description: '',
    changeReason: '',
    isActive: true
  });

  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        type: typeFilter
      });

      const response = await fetch(`${config.api.baseUrl}/api/configs?${queryParams}`, {
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
      });

      if (!response.ok) throw new Error('Failed to fetch configs');
      
      const data = await response.json();
      console.log('Configs data:', data); // Debug log
      const safeData = Array.isArray(data.data) ? data.data : [];
      setConfigs(safeData);
      setTotalConfigs(Number(data.total) || 0);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(String(err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConfigs();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchQuery, typeFilter]);

  const handleSave = async () => {
    try {
      const url = modalMode === 'add' 
        ? `${config.api.baseUrl}/api/configs` 
        : `${config.api.baseUrl}/api/configs/${currentConfig.id}`;
      
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentConfig)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to save config');
      }

      if (showToast) showToast(modalMode === 'add' ? 'Config added successfully' : 'Config updated successfully', 'success');
      else alert(modalMode === 'add' ? 'Config added successfully' : 'Config updated successfully');
      setShowModal(false);
      fetchConfigs();
    } catch (err) {
      if (showToast) showToast(String(err.message), 'error');
      else alert(String(err.message));
    }
  };

  const handleDelete = (configItem) => {
    setConfigToDelete(configItem);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!configToDelete) return;
    
    try {
      const response = await fetch(`${config.api.baseUrl}/api/configs/${configToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete config');
      
      alert('Config deleted successfully');
      setShowDeleteModal(false);
      setConfigToDelete(null);
      fetchConfigs();
    } catch (err) {
      alert(String(err.message));
    }
  };

  const handleViewHistory = async (id) => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const response = await fetch(`${config.api.baseUrl}/api/configs/${id}/history`, {
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistoryData(Array.isArray(data) ? data : []);
    } catch (err) {
      if (showToast) showToast(String(err.message), 'error');
      else alert(String(err.message));
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderValue = (cfg) => {
    if (!cfg) return '';
    if (cfg.dataType === 'boolean') {
      return String(cfg.mainValue) === 'true' 
        ? React.createElement('span', { className: 'badge bg-success' }, 'True')
        : React.createElement('span', { className: 'badge bg-danger' }, 'False');
    }
    // Safety check for objects
    if (typeof cfg.mainValue === 'object' && cfg.mainValue !== null) {
      return JSON.stringify(cfg.mainValue);
    }
    return String(cfg.mainValue !== null && cfg.mainValue !== undefined ? cfg.mainValue : '');
  };

  const renderInput = () => {
    const inputProps = {
        key: 'input',
        className: 'form-control form-control-modern',
        value: typeof currentConfig.mainValue === 'object' ? JSON.stringify(currentConfig.mainValue) : (currentConfig.mainValue || ''),
        onChange: (e) => setCurrentConfig({...currentConfig, mainValue: e.target.value})
    };

    switch (currentConfig.dataType) {
      case 'boolean':
        return React.createElement('div', { className: 'form-check form-switch mb-3' }, [
            React.createElement('input', {
              key: 'input',
              className: 'form-check-input',
              type: 'checkbox',
              checked: currentConfig.mainValue === 'true',
              onChange: (e) => setCurrentConfig({...currentConfig, mainValue: e.target.checked ? 'true' : 'false'})
            }),
            React.createElement('label', { key: 'label', className: 'form-check-label' }, 'Enabled (True/False)')
        ]);
      case 'integer':
      case 'float':
        return React.createElement('div', { className: 'mb-3' }, [
            React.createElement('label', { key: 'label', className: 'form-label small fw-bold text-muted' }, 'Value'),
            React.createElement('input', {
              ...inputProps,
              type: 'number',
              step: currentConfig.dataType === 'float' ? '0.01' : '1'
            })
        ]);
      case 'json':
        return React.createElement('div', { className: 'mb-3' }, [
            React.createElement('label', { key: 'label', className: 'form-label small fw-bold text-muted' }, 'JSON Value'),
            React.createElement('textarea', {
              ...inputProps,
              className: 'form-control form-control-modern font-monospace',
              rows: '5',
              value: typeof currentConfig.mainValue === 'object' ? JSON.stringify(currentConfig.mainValue, null, 2) : (currentConfig.mainValue || '')
            }),
            React.createElement('div', { key: 'help', className: 'form-text' }, 'Ensure valid JSON format.')
        ]);
      default:
        return React.createElement('div', { className: 'mb-3' }, [
            React.createElement('label', { key: 'label', className: 'form-label small fw-bold text-muted' }, 'Value'),
            React.createElement('input', {
              ...inputProps,
              type: 'text'
            })
        ]);
    }
  };

  // Pagination Calculation
  const totalPages = Math.ceil(totalConfigs / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return React.createElement('div', { className: 'modern-card p-4 animate-fade-in' }, [
      // Header (Title + Actions)
      React.createElement('div', { key: 'header', className: 'd-flex flex-wrap gap-3 justify-content-between align-items-center mb-4' }, [
        React.createElement('h5', { key: 'title', className: 'fw-bold mb-0' }, 'System Configuration'),
        
        React.createElement('div', { key: 'actions', className: 'd-flex gap-3 align-items-center' }, [
            // Search Input
            React.createElement('div', { className: 'search-container-modern' }, [
                loading 
                    ? React.createElement('div', { key: 'spinner', className: 'spinner-border text-primary spinner-border-sm me-2', role: 'status' })
                    : React.createElement('i', { key: 'icon', className: 'fa-solid fa-magnifying-glass text-muted small' }),
                React.createElement('input', { 
                    key: 'input',
                    type: 'text', 
                    className: 'search-input-modern', 
                    placeholder: 'Search configs...',
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value)
                })
            ]),
            
            // Type Filter
            React.createElement('select', {
                  key: 'type-filter',
                  className: 'form-select-modern',
                  style: { width: 'auto', minWidth: '120px' },
                  value: typeFilter,
                  onChange: (e) => setTypeFilter(e.target.value)
              }, [
                  React.createElement('option', { key: 'all', value: '' }, 'All Types'),
                  React.createElement('option', { key: 'str', value: 'string' }, 'String'),
                  React.createElement('option', { key: 'int', value: 'integer' }, 'Integer'),
                  React.createElement('option', { key: 'bool', value: 'boolean' }, 'Boolean'),
                  React.createElement('option', { key: 'float', value: 'float' }, 'Float'),
                  React.createElement('option', { key: 'json', value: 'json' }, 'JSON')
              ]),

            // Add Button
            React.createElement('button', { 
                className: 'btn-add-modern', 
                onClick: () => {
                    setModalMode('add');
                    setCurrentConfig({
                      id: 0, configKey: '', dataType: 'string', mainValue: '', 
                      alternativeValue: '', description: '', isActive: true
                    });
                    setShowModal(true);
                }
            }, [
                React.createElement('i', { key: 'icon', className: 'fa-solid fa-plus' }),
                React.createElement('span', { key: 'text' }, 'Add Config')
            ])
        ])
      ]),

      // Table
      React.createElement('div', { key: 'table', className: 'table-responsive position-relative' }, [
          loading && React.createElement('div', { 
              key: 'overlay',
              className: 'table-loading-overlay position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center',
              style: { zIndex: 5 }
          }),
          React.createElement('table', { className: 'table table-hover align-middle mb-0 table-modern' }, [
              React.createElement('thead', { key: 'thead' }, 
                  React.createElement('tr', null, [
                      React.createElement('th', { key: 'key' }, 'Key'),
                      React.createElement('th', { key: 'type' }, 'Type'),
                      React.createElement('th', { key: 'value' }, 'Value'),
                      React.createElement('th', { key: 'desc' }, 'Description'),
                      React.createElement('th', { key: 'status' }, 'Status'),
                      React.createElement('th', { key: 'actions', className: 'text-end' }, 'Actions')
                  ])
              ),
              React.createElement('tbody', { key: 'tbody' }, 
                  configs.length === 0 && !loading
                  ? React.createElement('tr', null, React.createElement('td', { colSpan: '6', className: 'text-center py-5 text-muted' }, [
                      React.createElement('i', { key: 'icon', className: 'fa-solid fa-magnifying-glass mb-3 fs-3 d-block opacity-50' }),
                      React.createElement('span', { key: 'text' }, 'No configs found')
                    ]))
                  : configs.map(cfg => {
                      if (!cfg) return null;
                      return React.createElement('tr', { key: String(cfg.id) }, [
                          React.createElement('td', { key: 'key', className: 'fw-bold text-primary' }, String(cfg.configKey || '')),
                          React.createElement('td', { key: 'type' }, React.createElement('span', { className: 'badge bg-modern-subtle text-dark border' }, String(cfg.dataType || ''))),
                          React.createElement('td', { key: 'value', className: 'text-truncate', style: { maxWidth: '200px' } }, renderValue(cfg)),
                          React.createElement('td', { key: 'desc', className: 'text-muted small' }, String(cfg.description || '')),
                          React.createElement('td', { key: 'status' }, 
                              cfg.isActive 
                              ? React.createElement('span', { className: 'badge bg-success bg-opacity-10 text-success' }, 'Active')
                              : React.createElement('span', { className: 'badge bg-danger bg-opacity-10 text-danger' }, 'Inactive')
                          ),
                          React.createElement('td', { key: 'actions', className: 'text-end' }, [
                              React.createElement('button', {
                                  key: 'edit',
                                  className: 'btn btn-sm btn-link text-primary',
                                  onClick: () => {
                                      setModalMode('edit');
                                      setCurrentConfig(cfg);
                                      setShowModal(true);
                                  },
                                  title: 'Edit'
                              }, React.createElement('i', { className: 'fa-solid fa-pen-to-square' })),
                              React.createElement('button', {
                                  key: 'history',
                                  className: 'btn btn-sm btn-link text-info',
                                  onClick: () => handleViewHistory(cfg.id),
                                  title: 'History'
                              }, React.createElement('i', { className: 'fa-solid fa-clock-rotate-left' })),
                              React.createElement('button', {
                                  key: 'delete',
                                  className: 'btn btn-sm btn-link text-danger',
                                  onClick: () => handleDelete(cfg),
                                  title: 'Delete'
                              }, React.createElement('i', { className: 'fa-solid fa-trash' }))
                          ])
                      ]);
                  })
              )
          ])
      ]),

      // Pagination
      React.createElement('div', { key: 'pagination', className: 'd-flex justify-content-between align-items-center mt-4 border-top pt-3' }, [
          // Showing info
          React.createElement('div', { key: 'info', className: 'text-muted small' }, 
              `Showing ${Math.min(indexOfFirstItem + 1, totalConfigs)} to ${Math.min(indexOfLastItem, totalConfigs)} of ${totalConfigs} entries`
          ),
          // Pagination Buttons
          React.createElement('nav', { key: 'nav' }, 
              React.createElement('ul', { className: 'pagination pagination-modern mb-0' }, [
                  // First Page
                  React.createElement('li', { key: 'first', className: `page-item ${currentPage === 1 ? 'disabled' : ''}` },
                      React.createElement('button', { className: 'page-link', onClick: () => handlePageChange(1), title: 'First Page' }, 
                          React.createElement('i', { className: 'fa-solid fa-angles-left' })
                      )
                  ),
                  // Previous
                  React.createElement('li', { key: 'prev', className: `page-item ${currentPage === 1 ? 'disabled' : ''}` },
                      React.createElement('button', { className: 'page-link', onClick: () => handlePageChange(Math.max(1, currentPage - 1)), title: 'Previous' }, 
                          React.createElement('i', { className: 'fa-solid fa-chevron-left' })
                      )
                  ),
                  // Page Numbers
                  ...(() => {
                      const maxButtons = 7;
                      let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                      let endPage = startPage + maxButtons - 1;

                      if (endPage > totalPages) {
                          endPage = totalPages;
                          startPage = Math.max(1, endPage - maxButtons + 1);
                      }
                      
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                      }
                      return pages;
                  })().map(page => {
                        return React.createElement('li', { key: page, className: `page-item ${currentPage === page ? 'active' : ''}` },
                            React.createElement('button', { className: 'page-link', onClick: () => handlePageChange(page) }, page)
                        );
                  }),
                  // Next
                  React.createElement('li', { key: 'next', className: `page-item ${currentPage === totalPages || totalConfigs === 0 ? 'disabled' : ''}` },
                      React.createElement('button', { className: 'page-link', onClick: () => handlePageChange(Math.min(totalPages, currentPage + 1)), title: 'Next' }, 
                          React.createElement('i', { className: 'fa-solid fa-chevron-right' })
                      )
                  ),
                  // Last Page
                  React.createElement('li', { key: 'last', className: `page-item ${currentPage === totalPages || totalConfigs === 0 ? 'disabled' : ''}` },
                      React.createElement('button', { className: 'page-link', onClick: () => handlePageChange(totalPages), title: 'Last Page' }, 
                          React.createElement('i', { className: 'fa-solid fa-angles-right' })
                      )
                  )
              ])
          )
      ]),

      // Modals (Add/Edit + History)
      showModal && ReactDOM.createPortal(
          React.createElement('div', { key: 'modal', className: 'modal fade show d-block', style: { zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' } },
              React.createElement('div', { className: 'modal-dialog modal-dialog-centered modal-lg' },
                  React.createElement('div', { className: 'modal-content border-0 shadow-lg animate-fade-in overflow-hidden', style: { borderRadius: '20px' } }, [
                      React.createElement('div', { key: 'header', className: 'modal-header border-bottom-0 bg-modern-subtle' }, [
                          React.createElement('h5', { key: 'title', className: 'modal-title fw-bold' }, modalMode === 'add' ? 'Add Configuration' : 'Edit Configuration'),
                          React.createElement('button', { key: 'close', type: 'button', className: 'btn-close', onClick: () => setShowModal(false) })
                      ]),
                      React.createElement('div', { key: 'body', className: 'modal-body p-4' }, 
                          React.createElement('div', { className: 'row g-3' }, [
                              React.createElement('div', { key: 'key-grp', className: 'col-md-6' }, [
                                  React.createElement('label', { key: 'label', className: 'form-label small fw-bold text-muted' }, 'Config Key'),
                                  React.createElement('input', {
                                      key: 'input',
                                      type: 'text',
                                      className: 'form-control form-control-modern',
                                      value: currentConfig.configKey || '',
                                      onChange: (e) => setCurrentConfig({...currentConfig, configKey: e.target.value}),
                                      disabled: modalMode === 'edit'
                                  })
                              ]),
                              React.createElement('div', { key: 'type-grp', className: 'col-md-6' }, [
                                  React.createElement('label', { key: 'label', className: 'form-label small fw-bold text-muted' }, 'Data Type'),
                                  React.createElement('select', {
                                      key: 'select',
                                      className: 'form-select form-select-modern',
                                      value: currentConfig.dataType,
                                      onChange: (e) => setCurrentConfig({...currentConfig, dataType: e.target.value, mainValue: ''}),
                                      disabled: modalMode === 'edit'
                                  }, [
                                      React.createElement('option', { key: 'str', value: 'string' }, 'String'),
                                      React.createElement('option', { key: 'int', value: 'integer' }, 'Integer'),
                                      React.createElement('option', { key: 'bool', value: 'boolean' }, 'Boolean'),
                                      React.createElement('option', { key: 'float', value: 'float' }, 'Float'),
                                      React.createElement('option', { key: 'json', value: 'json' }, 'JSON')
                                  ])
                              ]),
                              React.createElement('div', { key: 'val-grp', className: 'col-12' }, renderInput()),
                              React.createElement('div', { key: 'desc-grp', className: 'col-12' }, [
                                  React.createElement('label', { key: 'label', className: 'form-label small fw-bold text-muted' }, 'Description'),
                                  React.createElement('textarea', {
                                      key: 'input',
                                      className: 'form-control form-control-modern',
                                      rows: '2',
                                      value: currentConfig.description || '',
                                      onChange: (e) => setCurrentConfig({...currentConfig, description: e.target.value})
                                  })
                              ]),
                              React.createElement('div', { key: 'active-grp', className: 'col-12' }, 
                                  React.createElement('div', { className: 'form-check form-switch' }, [
                                      React.createElement('input', {
                                          key: 'input',
                                          className: 'form-check-input',
                                          type: 'checkbox',
                                          checked: currentConfig.isActive,
                                          onChange: (e) => setCurrentConfig({...currentConfig, isActive: e.target.checked})
                                      }),
                                      React.createElement('label', { key: 'label', className: 'form-check-label small' }, 'Active Status')
                                  ])
                              )
                          ])
                      ),
                      React.createElement('div', { key: 'footer', className: 'modal-footer border-top-0 bg-modern-subtle' }, [
                          React.createElement('button', { key: 'cancel', type: 'button', className: 'btn btn-modern-light rounded-pill px-4', onClick: () => setShowModal(false) }, 'Cancel'),
                          React.createElement('button', { key: 'save', type: 'button', className: 'btn btn-primary rounded-pill px-4 btn-primary-modern', onClick: handleSave }, 'Save Changes')
                      ])
                  ])
              )
          ),
          document.body,
          'config-modal'
      ),

      // History Modal
      showHistoryModal && ReactDOM.createPortal(
          React.createElement('div', { key: 'hist-modal', className: 'modal fade show d-block', style: { zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' } },
              React.createElement('div', { className: 'modal-dialog modal-lg modal-dialog-centered' },
                  React.createElement('div', { className: 'modal-content border-0 shadow-lg animate-fade-in overflow-hidden', style: { borderRadius: '20px' } }, [
                      React.createElement('div', { key: 'header', className: 'modal-header border-bottom-0 bg-modern-subtle' }, [
                          React.createElement('h5', { key: 'title', className: 'modal-title fw-bold' }, 'Change History'),
                          React.createElement('button', { key: 'close', type: 'button', className: 'btn-close', onClick: () => setShowHistoryModal(false) })
                      ]),
                      React.createElement('div', { key: 'body', className: 'modal-body p-4' }, 
                          historyLoading 
                          ? React.createElement('div', { className: 'text-center p-3' }, 'Loading history...')
                          : React.createElement('div', { className: 'table-responsive' }, 
                              React.createElement('table', { className: 'table table-hover align-middle mb-0 table-modern' }, [
                                  React.createElement('thead', { key: 'thead' }, 
                                      React.createElement('tr', null, [
                                          React.createElement('th', { key: 'date' }, 'Date'),
                                          React.createElement('th', { key: 'by' }, 'Changed By'),
                                          React.createElement('th', { key: 'old' }, 'Old Value'),
                                          React.createElement('th', { key: 'new' }, 'New Value'),
                                          React.createElement('th', { key: 'reason' }, 'Reason')
                                      ])
                                  ),
                                  React.createElement('tbody', { key: 'tbody' }, 
                                      historyData.length === 0
                                      ? React.createElement('tr', null, React.createElement('td', { colSpan: '5', className: 'text-center text-muted' }, 'No history found'))
                                      : historyData.map(h => {
                                          if (!h) return null;
                                          return React.createElement('tr', { key: String(h.id) }, [
                                              React.createElement('td', { key: 'date' }, new Date(h.changedAt).toLocaleString()),
                                              React.createElement('td', { key: 'by' }, String(h.changedBy || '')),
                                              React.createElement('td', { key: 'old', className: 'text-break', style: { maxWidth: '150px' } }, typeof h.oldValue === 'object' ? JSON.stringify(h.oldValue) : String(h.oldValue || '')),
                                              React.createElement('td', { key: 'new', className: 'text-break', style: { maxWidth: '150px' } }, typeof h.newValue === 'object' ? JSON.stringify(h.newValue) : String(h.newValue || '')),
                                              React.createElement('td', { key: 'reason' }, String(h.changeReason || ''))
                                          ]);
                                      })
                                  )
                              ])
                          )
                      )
                  ])
              )
          ),
          document.body,
          'history-modal'
      ),

      // Delete Confirmation Modal
      showDeleteModal && ReactDOM.createPortal(
        React.createElement('div', { 
            key: 'delete-modal', 
            className: 'modal fade show d-block', 
            tabIndex: '-1',
            style: { zIndex: 1060, display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' },
            role: 'dialog'
        }, 
          React.createElement('div', { className: 'modal-dialog modal-dialog-centered modal-sm' }, 
              React.createElement('div', { className: 'modal-content border-0 shadow-lg animate-fade-in text-center p-4', style: { borderRadius: '24px' } }, [
                  React.createElement('div', { key: 'icon-wrap', className: 'mb-3' }, 
                    React.createElement('div', { key: 'icon-bg', className: 'rounded-circle bg-danger bg-opacity-10 d-inline-flex align-items-center justify-content-center', style: { width: '64px', height: '64px' } },
                        React.createElement('i', { className: 'fa-solid fa-triangle-exclamation text-danger fs-3' })
                    )
                  ),
                  React.createElement('h5', { key: 'title', className: 'fw-bold mb-2' }, 'Delete Config?'),
                  React.createElement('p', { key: 'text', className: 'text-muted small mb-4' }, `Are you sure you want to delete "${configToDelete?.configKey}"? This action cannot be undone.`),
                  React.createElement('div', { key: 'buttons', className: 'd-flex gap-2 justify-content-center' }, [
                      React.createElement('button', { key: 'cancel', type: 'button', className: 'btn btn-light rounded-pill px-4 w-50', onClick: () => setShowDeleteModal(false) }, 'Cancel'),
                      React.createElement('button', { key: 'confirm', type: 'button', className: 'btn btn-danger rounded-pill px-4 w-50', onClick: confirmDelete }, 'Delete')
                  ])
              ])
          )
        ),
        document.body,
        'delete-modal'
      )
  ]);
}
