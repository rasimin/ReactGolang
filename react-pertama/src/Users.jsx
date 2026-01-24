const React = window.React;
const ReactDOM = window.ReactDOM; // Add ReactDOM
import config from './config.js';
const { useState, useEffect } = React;

export default function Users({ showToast }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentUser, setCurrentUser] = useState({
    id: 0,
    name: '',
    email: '',
    role: 'user',
    roleId: 0,
    isActive: true,
    password: ''
  });

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${config.api.baseUrl}/api/roles`, {
        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
      });
      if (response.ok) {
        const data = await response.json();
        // Handle both array (legacy) and paginated response object
        setRoles(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery
      });

      const response = await fetch(`${config.api.baseUrl}/api/users?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
         if (response.status === 401) {
             throw new Error('Unauthorized - Please login again');
         }
         throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.data || []);
      setTotalUsers(data.total || 0);
      setIsFirstLoad(false);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSave = async () => {
    try {
      const url = config.api.baseUrl + '/api/users';
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const body = { ...currentUser };
      
      if (modalMode === 'add' && !body.password) {
          if (showToast) showToast("Password is required for new users", 'error');
          else alert("Password is required for new users");
          return;
      }

      if (modalMode === 'edit') {
         if (!body.password) delete body.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to save user');
      }

      if (showToast) showToast(modalMode === 'add' ? 'User added successfully' : 'User updated successfully', 'success');
      else alert(modalMode === 'add' ? 'User added successfully' : 'User updated successfully');
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
      else alert(err.message);
    }
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`${config.api.baseUrl}/api/users?id=${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
      });
      if (!response.ok) throw new Error('Failed to delete user');
      if (showToast) showToast('User deleted successfully', 'success');
      else alert('User deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
      else alert(err.message);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setCurrentUser({
      id: 0,
      name: '',
      email: '',
      role: 'user',
      isActive: true,
      password: ''
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setCurrentUser({ ...user, password: '' });
    setShowModal(true);
    fetchRoles();
  };

  // Modern Loading State (Only on first load)
  if (isFirstLoad && loading) {
    return React.createElement('div', { className: 'd-flex flex-column justify-content-center align-items-center', style: { minHeight: '60vh' } }, [
      React.createElement('div', { key: 'spinner', className: 'spinner-modern' }),
      React.createElement('div', { key: 'text', className: 'loading-text' }, 'LOADING DATA...')
    ]);
  }

  if (error) return React.createElement('div', { className: 'alert alert-danger' }, `Error: ${error}`);

  // Server-side pagination
  const currentItems = users;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return React.createElement('div', { className: 'modern-card p-4 animate-fade-in' }, [
      // Header
      React.createElement('div', { key: 'header', className: 'd-flex flex-wrap gap-3 justify-content-between align-items-center mb-4' }, [
        React.createElement('h5', { key: 'title', className: 'fw-bold mb-0' }, 'User Management'),
        React.createElement('div', { key: 'actions', className: 'd-flex gap-3 align-items-center' }, [
            // Modern Search Input
            React.createElement('div', { className: 'search-container-modern' }, [
                loading && !isFirstLoad 
                    ? React.createElement('div', { key: 'spinner', className: 'spinner-border text-primary spinner-border-sm me-2', role: 'status' })
                    : React.createElement('i', { key: 'icon', className: 'fa-solid fa-magnifying-glass text-muted small' }),
                React.createElement('input', { 
                    key: 'input',
                    type: 'text', 
                    className: 'search-input-modern', 
                    placeholder: 'Search users...',
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value)
                })
            ]),
            // Modern Add Button
            React.createElement('button', { className: 'btn-add-modern', onClick: openAddModal }, [
                React.createElement('i', { key: 'icon', className: 'fa-solid fa-plus' }),
                React.createElement('span', { key: 'text' }, 'Add User')
            ])
        ])
      ]),
      
      // Table
      React.createElement('div', { key: 'table', className: 'table-responsive position-relative' }, [
        loading && !isFirstLoad && React.createElement('div', { 
            key: 'overlay',
            className: 'table-loading-overlay position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center',
            style: { zIndex: 5 }
        }),
        React.createElement('table', { className: 'table table-hover align-middle mb-0 table-modern' }, [
          React.createElement('thead', { key: 'thead' }, 
            React.createElement('tr', null, React.Children.toArray([
              React.createElement('th', { key: 'name' }, 'Name'),
              React.createElement('th', { key: 'email' }, 'Email'),
              React.createElement('th', { key: 'role' }, 'Role'),
              React.createElement('th', { key: 'status' }, 'Status'),
              React.createElement('th', { key: 'actions', className: 'text-end' }, 'Actions'),
            ]))
          ),
          React.createElement('tbody', { key: 'tbody' }, 
            currentItems.length > 0 ? currentItems.map(user => 
                React.createElement('tr', { key: user.id }, [
                    // Name Column
                    React.createElement('td', { key: 'name' }, 
                        React.createElement('div', { className: 'd-flex align-items-center' }, [
                            React.createElement('div', { key: 'avatar', className: 'rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center me-3', style: { width: '32px', height: '32px' } }, 
                                user.profilePicture 
                                    ? React.createElement('img', { src: `/uploads/${user.profilePicture}`, className: 'rounded-circle', width: '32', height: '32' })
                                    : React.createElement('i', { className: 'fa-solid fa-user' })
                            ),
                            React.createElement('div', { key: 'info' }, 
                                React.createElement('h6', { className: 'mb-0 small fw-bold' }, user.name)
                            )
                        ])
                    ),
                    // Email
                    React.createElement('td', { key: 'email' }, React.createElement('small', { className: 'text-muted' }, user.email)),
                    // Role
                    React.createElement('td', { key: 'role' }, React.createElement('span', { className: 'badge bg-modern-subtle text-dark border' }, user.role)),
                    // Status
                    React.createElement('td', { key: 'status' }, 
                        user.isActive 
                            ? React.createElement('span', { className: 'badge bg-success bg-opacity-10 text-success' }, 'Active')
                            : React.createElement('span', { className: 'badge bg-danger bg-opacity-10 text-danger' }, 'Inactive')
                    ),
                    // Actions
                    React.createElement('td', { key: 'actions', className: 'text-end' }, React.Children.toArray([
                        React.createElement('button', { key: 'edit', className: 'btn btn-sm btn-link text-primary', onClick: () => openEditModal(user) }, 
                            React.createElement('i', { className: 'fa-solid fa-pen-to-square' })
                        ),
                        React.createElement('button', { key: 'delete', className: 'btn btn-sm btn-link text-danger', onClick: () => confirmDelete(user) }, 
                            React.createElement('i', { className: 'fa-solid fa-trash' })
                        )
                    ]))
                ])
            ) : React.createElement('tr', null, 
                React.createElement('td', { colSpan: 5, className: 'text-center py-5 text-muted' }, [
                    React.createElement('i', { key: 'icon', className: 'fa-solid fa-magnifying-glass mb-3 fs-3 d-block opacity-50' }),
                    React.createElement('span', { key: 'text' }, 'No users found matching your search')
                ])
            )
          )
        ])
      ]),

      // Pagination Footer
      React.createElement('div', { key: 'pagination', className: 'd-flex justify-content-between align-items-center mt-4 border-top pt-3' }, [
          // Showing info
          React.createElement('div', { key: 'info', className: 'text-muted small' }, 
              `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, totalUsers)} of ${totalUsers} entries`
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

      // Modal Backdrop (Using Portal)
      (showModal || showDeleteModal) && ReactDOM.createPortal(
        React.createElement('div', { 
            key: 'backdrop', 
            className: 'modal-backdrop fade show',
            style: { zIndex: 1050, backdropFilter: 'blur(4px)' } 
        }), 
        document.body,
        'backdrop'
      ),

      // Add/Edit Modal (Using Portal)
      showModal && ReactDOM.createPortal(
        React.createElement('div', { 
            key: 'modal', 
            className: 'modal fade show d-block', 
            tabIndex: '-1',
            style: { zIndex: 1055, display: 'block', overflowX: 'hidden', overflowY: 'auto' },
            role: 'dialog'
        }, 
          React.createElement('div', { className: 'modal-dialog modal-dialog-centered' }, 
              React.createElement('div', { className: 'modal-content border-0 shadow-lg animate-fade-in', style: { borderRadius: '20px' } }, [
                  // Modal Header
                  React.createElement('div', { key: 'header', className: 'modal-header border-bottom-0 bg-modern-subtle' }, [
                      React.createElement('h5', { key: 'title', className: 'modal-title fw-bold' }, modalMode === 'add' ? 'Add New User' : 'Edit User'),
                      React.createElement('button', { key: 'close', type: 'button', className: 'btn-close', onClick: () => setShowModal(false) })
                  ]),
                  // Modal Body
          React.createElement('div', { key: 'body', className: 'modal-body p-4' }, 
              React.createElement('form', { key: 'form' }, [
                  React.createElement('div', { key: 'name-field', className: 'mb-3' }, [
                              React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Full Name'),
                              React.createElement('input', { type: 'text', className: 'form-control form-control-modern', placeholder: 'e.g. John Doe', value: currentUser.name, onChange: e => setCurrentUser({...currentUser, name: e.target.value}) })
                          ]),
                  React.createElement('div', { key: 'email-field', className: 'mb-3' }, [
                              React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Email Address'),
                              React.createElement('input', { type: 'email', className: 'form-control form-control-modern', placeholder: 'e.g. john@example.com', value: currentUser.email, onChange: e => setCurrentUser({...currentUser, email: e.target.value}) })
                          ]),
                  React.createElement('div', { key: 'row', className: 'row' }, [
                      React.createElement('div', { key: 'role-col', className: 'col-md-6 mb-3' }, [
                                    React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Role'),
                            React.createElement('select', { 
                                className: 'form-select-modern w-100', 
                                value: currentUser.roleId || '', 
                                onChange: e => {
                                    const selectedId = parseInt(e.target.value);
                                    const selectedRole = roles.find(r => r.id === selectedId);
                                    setCurrentUser({
                                        ...currentUser, 
                                        roleId: selectedId,
                                        role: selectedRole ? selectedRole.name : '' 
                                    });
                                }
                            }, [
                                React.createElement('option', { key: 'default', value: '' }, 'Select Role'),
                                ...roles.map(role => 
                                    React.createElement('option', { key: role.id, value: role.id }, role.name)
                                )
                            ])
                                ]),
                      React.createElement('div', { key: 'status-col', className: 'col-md-6 mb-3' }, [
                                  React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Status'),
                          React.createElement('div', { key: 'switch', className: 'form-check form-switch mt-2' }, [
                              React.createElement('input', { 
                                  key: 'checkbox',
                                          type: 'checkbox', 
                                          className: 'form-check-input', 
                                          id: 'isActiveCheck', 
                                          checked: currentUser.isActive, 
                                          onChange: e => setCurrentUser({...currentUser, isActive: e.target.checked}) 
                                      }),
                              React.createElement('label', { key: 'label', className: 'form-check-label small', htmlFor: 'isActiveCheck' }, currentUser.isActive ? 'Active' : 'Inactive')
                                  ])
                              ])
                          ]),
                  React.createElement('div', { key: 'password-field', className: 'mb-3' }, [
                              React.createElement('label', { className: 'form-label small fw-bold text-muted' }, modalMode === 'edit' ? 'New Password (Optional)' : 'Password'),
                              React.createElement('input', { type: 'password', className: 'form-control form-control-modern', placeholder: '••••••••', value: currentUser.password, onChange: e => setCurrentUser({...currentUser, password: e.target.value}) })
                          ])
                      ])
                  ),
                  // Modal Footer
          React.createElement('div', { key: 'footer', className: 'modal-footer border-top-0 bg-modern-subtle' }, [
              React.createElement('button', { key: 'cancel', type: 'button', className: 'btn btn-modern-light rounded-pill px-4', onClick: () => setShowModal(false) }, 'Cancel'),
              React.createElement('button', { key: 'save', type: 'button', className: 'btn btn-primary rounded-pill px-4 btn-primary-modern', onClick: handleSave }, 'Save Changes')
                  ])
              ])
          )
        ),
        document.body,
        'modal'
      ),

      // Delete Confirmation Modal
      showDeleteModal && ReactDOM.createPortal(
        React.createElement('div', { 
            key: 'delete-modal', 
            className: 'modal fade show d-block', 
            tabIndex: '-1',
            style: { zIndex: 1060, display: 'block', overflowX: 'hidden', overflowY: 'auto' },
            role: 'dialog'
        }, 
          React.createElement('div', { className: 'modal-dialog modal-dialog-centered modal-sm' }, 
              React.createElement('div', { className: 'modal-content border-0 shadow-lg animate-fade-in text-center p-4', style: { borderRadius: '24px' } }, [
                  React.createElement('div', { key: 'icon-wrap', className: 'mb-3' }, 
                    React.createElement('div', { key: 'icon-bg', className: 'rounded-circle bg-danger bg-opacity-10 d-inline-flex align-items-center justify-content-center', style: { width: '64px', height: '64px' } },
                        React.createElement('i', { className: 'fa-solid fa-triangle-exclamation text-danger fs-3' })
                    )
                  ),
                  React.createElement('h5', { key: 'title', className: 'fw-bold mb-2' }, 'Delete User?'),
                  React.createElement('p', { key: 'text', className: 'text-muted small mb-4' }, `Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`),
                  React.createElement('div', { key: 'buttons', className: 'd-flex gap-2 justify-content-center' }, [
                      React.createElement('button', { key: 'cancel', type: 'button', className: 'btn btn-light rounded-pill px-4 w-50', onClick: () => setShowDeleteModal(false) }, 'Cancel'),
                      React.createElement('button', { key: 'confirm', type: 'button', className: 'btn btn-danger rounded-pill px-4 w-50', onClick: handleDelete }, 'Delete')
                  ])
              ])
          )
        ),
        document.body,
        'delete-modal'
      )
  ]);
}
