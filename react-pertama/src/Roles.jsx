const React = window.React;
import config from './config.js';
const { useState, useEffect } = React;

export default function Roles({ showToast }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRoles, setTotalRoles] = useState(0);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentRole, setCurrentRole] = useState({ id: 0, name: '', description: '' });
  const [roleToDelete, setRoleToDelete] = useState(null);
  
  // State for viewing users in a role
  const [selectedRoleForUsers, setSelectedRoleForUsers] = useState(null);
  const [roleUsers, setRoleUsers] = useState([]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery
      });

      const response = await fetch(`${config.api.baseUrl}/api/roles?${queryParams}`, {
        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setRoles(data.data || []);
          setTotalRoles(data.total || 0);
          setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
        } else {
          // Fallback for old API response (if any)
          setRoles(Array.isArray(data) ? data : []);
          setTotalRoles(Array.isArray(data) ? data.length : 0);
          setTotalPages(1);
        }
        setIsFirstLoad(false);
      } else {
        if (showToast) showToast('Failed to fetch roles', 'error');
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      if (showToast) showToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch system configs for pagination limit
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${config.api.baseUrl}/api/configs`, {
          headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Config API returns paginated response { data: [], total: ... }
          const configList = data.data || (Array.isArray(data) ? data : []);
          const paginationConfig = configList.find(c => c.configKey === 'pagination_limit');
          if (paginationConfig) {
            const limit = parseInt(paginationConfig.mainValue, 10);
            if (!isNaN(limit) && limit > 0) {
              setItemsPerPage(limit);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching pagination config:', error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRoles();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage, searchQuery]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSave = async () => {
    if (!currentRole.name) {
      if (showToast) showToast('Role Name is required', 'error');
      else alert('Role Name is required');
      return;
    }

    try {
      let url = `${config.api.baseUrl}/api/roles`;
      let method = 'POST';
      
      if (modalMode === 'edit') {
        url = `${config.api.baseUrl}/api/roles/${currentRole.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentRole)
      });

      if (response.ok) {
        if (showToast) showToast(modalMode === 'add' ? 'Role added successfully' : 'Role updated successfully', 'success');
        setShowModal(false);
        fetchRoles();
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save role');
      }
    } catch (err) {
      console.error("Failed to save role:", err);
      if (showToast) showToast(err.message, 'error');
    }
  };

  const confirmDelete = (role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (roleToDelete) {
      try {
        const response = await fetch(`${config.api.baseUrl}/api/roles/${roleToDelete.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
        });
        
        if (response.ok) {
          if (showToast) showToast('Role deleted successfully', 'success');
          setShowDeleteModal(false);
          setRoleToDelete(null);
          fetchRoles();
        } else {
          throw new Error('Failed to delete role');
        }
      } catch (err) {
        if (showToast) showToast(err.message, 'error');
      }
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setCurrentRole({ id: 0, name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setModalMode('edit');
    setCurrentRole({ ...role });
    setShowModal(true);
  };
  
  const openUsersModal = async (role) => {
    setSelectedRoleForUsers(role);
    setRoleUsers([]);
    setShowUsersModal(true);
    
    try {
      const response = await fetch(`${config.api.baseUrl}/api/users?roleId=${role.id}&limit=100`, {
        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
      });
      if (response.ok) {
        const data = await response.json();
        setRoleUsers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch users for role:", err);
      if (showToast) showToast('Failed to fetch users', 'error');
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'd-flex flex-column justify-content-center align-items-center', style: { minHeight: '60vh' } }, [
      React.createElement('div', { key: 'spinner', className: 'spinner-modern' }),
      React.createElement('div', { key: 'text', className: 'loading-text' }, 'LOADING ROLES...')
    ]);
  }

  return React.createElement('div', { className: 'modern-card p-4 animate-fade-in' }, [
    // Header
    React.createElement('div', { key: 'header', className: 'd-flex flex-wrap gap-3 justify-content-between align-items-center mb-4' }, [
      React.createElement('h5', { key: 'title', className: 'fw-bold mb-0' }, 'Role Management'),
      React.createElement('div', { key: 'actions', className: 'd-flex gap-3 align-items-center' }, [
        // Search Input
        React.createElement('div', { className: 'search-container-modern' }, [
          React.createElement('i', { key: 'icon', className: 'fa-solid fa-magnifying-glass text-muted small' }),
          React.createElement('input', { 
            key: 'input',
            type: 'text', 
            className: 'search-input-modern', 
            placeholder: 'Search roles...',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value)
          })
        ]),
        // Add Button
        React.createElement('button', { 
          className: 'btn-add-modern',
          onClick: openAddModal
        }, [
          React.createElement('i', { key: 'icon', className: 'fa-solid fa-plus' }),
          'Add Role'
        ])
      ])
    ]),

    // Table
    React.createElement('div', { key: 'table-responsive', className: 'table-responsive position-relative' }, [
      loading && !isFirstLoad && React.createElement('div', { 
          key: 'overlay',
          className: 'table-loading-overlay position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center',
          style: { zIndex: 5 }
      }),
      React.createElement('table', { className: 'table table-modern table-hover align-middle' }, [
        React.createElement('thead', { key: 'thead' }, 
          React.createElement('tr', null, [
            React.createElement('th', { key: 'th-name', style: { width: '25%' } }, 'ROLE NAME'),
            React.createElement('th', { key: 'th-desc', style: { width: '35%' } }, 'DESCRIPTION'),
            React.createElement('th', { key: 'th-users', className: 'text-center', style: { width: '15%' } }, 'USERS'),
            React.createElement('th', { key: 'th-date', style: { width: '15%' } }, 'CREATED AT'),
            React.createElement('th', { key: 'th-actions', className: 'text-end', style: { width: '10%' } }, 'ACTIONS')
          ])
        ),
        React.createElement('tbody', { key: 'tbody' }, 
          roles.length > 0 ? roles.map(role => 
            React.createElement('tr', { key: role.id }, [
              React.createElement('td', { key: 'name' }, 
                React.createElement('div', { className: 'd-flex align-items-center' }, [
                  React.createElement('div', { className: 'rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center me-3', style: { width: '32px', height: '32px' } },
                    React.createElement('i', { className: 'fa-solid fa-shield-halved small' })
                  ),
                  React.createElement('span', { className: 'fw-medium' }, role.name)
                ])
              ),
              React.createElement('td', { key: 'desc', className: 'text-muted small' }, role.description),
              React.createElement('td', { key: 'users', className: 'text-center' }, 
                React.createElement('span', { className: 'badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3' }, 
                  `${role.userCount} Users`
                )
              ),
              React.createElement('td', { key: 'date', className: 'text-muted small' }, new Date(role.createdAt).toLocaleDateString()),
              React.createElement('td', { key: 'actions', className: 'text-end' }, 
                React.Children.toArray([
                  React.createElement('button', { 
                    key: 'view-users',
                    className: 'btn btn-sm btn-link text-info me-1',
                    title: 'View Users',
                    onClick: () => openUsersModal(role)
                  }, React.createElement('i', { className: 'fa-solid fa-users' })),
                  React.createElement('button', { 
                    key: 'edit',
                    className: 'btn btn-sm btn-link text-primary me-1',
                    title: 'Edit Role',
                    onClick: () => openEditModal(role)
                  }, React.createElement('i', { className: 'fa-solid fa-pen-to-square' })),
                  React.createElement('button', { 
                    key: 'delete',
                    className: 'btn btn-sm btn-link text-danger',
                    title: 'Delete Role',
                    onClick: () => confirmDelete(role)
                  }, React.createElement('i', { className: 'fa-solid fa-trash' }))
                ])
              )
            ])
          ) : React.createElement('tr', null, 
            React.createElement('td', { colSpan: 5, className: 'text-center py-5 text-muted' }, 
              React.createElement('div', null, [
                React.createElement('i', { key: 'icon', className: 'fa-solid fa-folder-open fa-2x mb-3 opacity-50' }),
                React.createElement('p', { key: 'text', className: 'mb-0' }, 'No roles found matching your search.')
              ])
            )
          )
        )
      ])
    ]),

    // Pagination Footer
    React.createElement('div', { key: 'pagination', className: 'd-flex justify-content-between align-items-center mt-4 border-top pt-3' }, [
        // Showing info
        React.createElement('div', { key: 'info', className: 'text-muted small' }, 
            `Showing ${roles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to ${Math.min(currentPage * itemsPerPage, totalRoles)} of ${totalRoles} entries`
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
                    React.createElement('button', { className: 'page-link', onClick: () => handlePageChange(currentPage - 1), title: 'Previous' }, 
                        React.createElement('i', { className: 'fa-solid fa-chevron-left' })
                    )
                ),
                // Page Numbers
                ...(() => {
                    const maxButtons = 5;
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
                React.createElement('li', { key: 'next', className: `page-item ${currentPage === totalPages ? 'disabled' : ''}` },
                    React.createElement('button', { className: 'page-link', onClick: () => handlePageChange(currentPage + 1), title: 'Next' }, 
                        React.createElement('i', { className: 'fa-solid fa-chevron-right' })
                    )
                ),
                // Last Page
                React.createElement('li', { key: 'last', className: `page-item ${currentPage === totalPages ? 'disabled' : ''}` },
                    React.createElement('button', { className: 'page-link', onClick: () => handlePageChange(totalPages), title: 'Last Page' }, 
                        React.createElement('i', { className: 'fa-solid fa-angles-right' })
                    )
                )
            ])
        )
    ]),

    // Add/Edit Modal
    showModal && window.ReactDOM.createPortal(
      React.createElement('div', { className: 'modal fade show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, overflowX: 'hidden', overflowY: 'auto' }, tabIndex: '-1' },
        React.createElement('div', { className: 'modal-dialog modal-dialog-centered' },
          React.createElement('div', { className: 'modal-content' }, [
            React.createElement('div', { key: 'header', className: 'modal-header border-0 pb-0' },
              React.createElement('h5', { className: 'modal-title fw-bold' }, modalMode === 'add' ? 'Add New Role' : 'Edit Role'),
              React.createElement('button', { type: 'button', className: 'btn-close', onClick: () => setShowModal(false) })
            ),
            React.createElement('div', { key: 'body', className: 'modal-body pt-4' }, [
              React.createElement('div', { className: 'mb-3' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'ROLE NAME'),
                React.createElement('input', {
                  type: 'text',
                  className: 'form-control form-control-modern',
                  placeholder: 'e.g. Content Editor',
                  value: currentRole.name,
                  onChange: (e) => setCurrentRole({ ...currentRole, name: e.target.value })
                })
              ]),
              React.createElement('div', { className: 'mb-3' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'DESCRIPTION'),
                React.createElement('textarea', {
                  className: 'form-control form-control-modern',
                  rows: 3,
                  placeholder: 'Describe the permissions for this role...',
                  value: currentRole.description,
                  onChange: (e) => setCurrentRole({ ...currentRole, description: e.target.value })
                })
              ])
            ]),
            React.createElement('div', { key: 'footer', className: 'modal-footer border-0 pt-0' }, [
              React.createElement('button', { 
                type: 'button', 
                className: 'btn btn-modern-light',
                onClick: () => setShowModal(false) 
              }, 'Cancel'),
              React.createElement('button', { 
                type: 'button', 
                className: 'btn btn-primary-modern px-4 rounded-pill',
                onClick: handleSave
              }, modalMode === 'add' ? 'Create Role' : 'Save Changes')
            ])
          ])
        )
      ), document.body
    ),

    // Delete Confirmation Modal
    showDeleteModal && window.ReactDOM.createPortal(
      React.createElement('div', { className: 'modal fade show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, overflowX: 'hidden', overflowY: 'auto' }, tabIndex: '-1' },
        React.createElement('div', { className: 'modal-dialog modal-dialog-centered modal-sm' },
          React.createElement('div', { className: 'modal-content' }, [
            React.createElement('div', { key: 'body', className: 'modal-body text-center p-4' }, [
              React.createElement('div', { className: 'mb-3 text-danger' },
                React.createElement('i', { className: 'fa-solid fa-circle-exclamation fa-3x' })
              ),
              React.createElement('h5', { className: 'fw-bold mb-2' }, 'Delete Role?'),
              React.createElement('p', { className: 'text-muted small mb-4' }, `Are you sure you want to delete "${roleToDelete?.name}"? This action cannot be undone.`),
              React.createElement('div', { className: 'd-flex gap-2 justify-content-center' }, [
                React.createElement('button', { 
                  className: 'btn btn-modern-light btn-sm px-3',
                  onClick: () => setShowDeleteModal(false)
                }, 'Cancel'),
                React.createElement('button', { 
                  className: 'btn btn-danger btn-sm px-3',
                  onClick: handleDelete
                }, 'Delete')
              ])
            ])
          ])
        )
      ), document.body
    ),
    
    // View Users Modal
    showUsersModal && window.ReactDOM.createPortal(
      React.createElement('div', { className: 'modal fade show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, overflowX: 'hidden', overflowY: 'auto' }, tabIndex: '-1' },
        React.createElement('div', { className: 'modal-dialog modal-dialog-centered modal-lg' },
          React.createElement('div', { className: 'modal-content' }, [
            React.createElement('div', { key: 'header', className: 'modal-header border-0' },
              React.createElement('h5', { className: 'modal-title fw-bold' }, [
                React.createElement('span', { className: 'text-muted fw-normal me-2' }, 'Users with Role:'),
                selectedRoleForUsers?.name
              ]),
              React.createElement('button', { type: 'button', className: 'btn-close', onClick: () => setShowUsersModal(false) })
            ),
            React.createElement('div', { key: 'body', className: 'modal-body p-0' }, 
              React.createElement('div', { className: 'table-responsive', style: { maxHeight: '400px' } },
                React.createElement('table', { className: 'table table-hover align-middle mb-0' }, [
                  React.createElement('thead', { className: 'bg-modern-subtle sticky-top' }, 
                    React.createElement('tr', null, [
                      React.createElement('th', { className: 'ps-4' }, 'Name'),
                      React.createElement('th', null, 'Email'),
                      React.createElement('th', null, 'Status'),
                      React.createElement('th', null, 'Last Login')
                    ])
                  ),
                  React.createElement('tbody', null,
                    roleUsers.length > 0 ? roleUsers.map(user => 
                      React.createElement('tr', { key: user.id }, [
                        React.createElement('td', { className: 'ps-4 fw-medium' }, user.name),
                        React.createElement('td', { className: 'text-muted small' }, user.email),
                        React.createElement('td', null, 
                          user.isActive 
                            ? React.createElement('span', { className: 'badge bg-success bg-opacity-10 text-success' }, 'Active')
                            : React.createElement('span', { className: 'badge bg-danger bg-opacity-10 text-danger' }, 'Inactive')
                        ),
                        React.createElement('td', { className: 'text-muted small' }, new Date(user.lastLogin).toLocaleDateString())
                      ])
                    ) : React.createElement('tr', null,
                      React.createElement('td', { colSpan: 4, className: 'text-center py-4 text-muted' }, 'No users assigned to this role yet.')
                    )
                  )
                ])
              )
            ),
            React.createElement('div', { key: 'footer', className: 'modal-footer border-0' },
              React.createElement('button', { 
                type: 'button', 
                className: 'btn btn-modern-light',
                onClick: () => setShowUsersModal(false) 
              }, 'Close')
            )
          ])
        )
      ), document.body
    )
  ]);
}