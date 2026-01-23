const React = window.React;
const ReactDOM = window.ReactDOM; // Add ReactDOM
import config from './config.js';
const { useState, useEffect } = React;

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentUser, setCurrentUser] = useState({
    id: 0,
    name: '',
    email: '',
    role: 'user',
    isActive: true,
    password: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(config.api.baseUrl + '/api/users', {
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
      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async () => {
    try {
      const url = config.api.baseUrl + '/api/users';
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const body = { ...currentUser };
      
      if (modalMode === 'add' && !body.password) {
          alert("Password is required for new users");
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

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
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
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      alert(err.message);
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
  };

  if (loading) return React.createElement('div', null, 'Loading...');
  if (error) return React.createElement('div', null, `Error: ${error}`);

  return React.createElement('div', { className: 'modern-card p-0 overflow-hidden animate-fade-in rounded-0 border-0 shadow-none' }, [
      // Header
      React.createElement('div', { key: 'header', className: 'p-4 border-bottom bg-modern-subtle d-flex justify-content-between align-items-center' }, [
        React.createElement('h5', { className: 'fw-bold mb-0' }, 'User Management'),
        React.createElement('button', { className: 'btn btn-primary btn-sm', onClick: openAddModal }, [
            React.createElement('i', { className: 'fa-solid fa-plus me-2' }),
            'Add User'
        ])
      ]),
      
      // Table
      React.createElement('div', { key: 'table', className: 'table-responsive' }, 
        React.createElement('table', { className: 'table table-hover align-middle mb-0' }, [
          React.createElement('thead', { className: 'bg-modern-subtle' }, 
            React.createElement('tr', null, [
              React.createElement('th', { className: 'ps-4 py-3' }, 'Name'),
              React.createElement('th', { className: 'py-3' }, 'Email'),
              React.createElement('th', { className: 'py-3' }, 'Role'),
              React.createElement('th', { className: 'py-3' }, 'Status'),
              React.createElement('th', { className: 'py-3 text-end pe-4' }, 'Actions'),
            ])
          ),
          React.createElement('tbody', null, 
            users.map(user => 
                React.createElement('tr', { key: user.id }, [
                    // Name Column
                    React.createElement('td', { className: 'ps-4' }, 
                        React.createElement('div', { className: 'd-flex align-items-center' }, [
                            React.createElement('div', { className: 'rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center me-3', style: { width: '32px', height: '32px' } }, 
                                user.profilePicture 
                                    ? React.createElement('img', { src: `/uploads/${user.profilePicture}`, className: 'rounded-circle', width: '32', height: '32' })
                                    : React.createElement('i', { className: 'fa-solid fa-user' })
                            ),
                            React.createElement('div', null, 
                                React.createElement('h6', { className: 'mb-0 small fw-bold' }, user.name)
                            )
                        ])
                    ),
                    // Email
                    React.createElement('td', null, React.createElement('small', { className: 'text-muted' }, user.email)),
                    // Role
                    React.createElement('td', null, React.createElement('span', { className: 'badge bg-light text-dark border' }, user.role)),
                    // Status
                    React.createElement('td', null, 
                        user.isActive 
                            ? React.createElement('span', { className: 'badge bg-success bg-opacity-10 text-success' }, 'Active')
                            : React.createElement('span', { className: 'badge bg-danger bg-opacity-10 text-danger' }, 'Inactive')
                    ),
                    // Actions
                    React.createElement('td', { className: 'text-end pe-4' }, [
                        React.createElement('button', { className: 'btn btn-sm btn-link text-primary', onClick: () => openEditModal(user) }, 
                            React.createElement('i', { className: 'fa-solid fa-pen-to-square' })
                        ),
                        React.createElement('button', { className: 'btn btn-sm btn-link text-danger', onClick: () => confirmDelete(user) }, 
                            React.createElement('i', { className: 'fa-solid fa-trash' })
                        )
                    ])
                ])
            )
          )
        ])
      ),

      // Modal Backdrop (Using Portal)
      (showModal || showDeleteModal) && ReactDOM.createPortal(
        React.createElement('div', { 
            key: 'backdrop', 
            className: 'modal-backdrop fade show',
            style: { zIndex: 1050, backdropFilter: 'blur(4px)' } 
        }), 
        document.body
      ),

      // Add/Edit Modal (Using Portal)
      showModal && ReactDOM.createPortal(
        React.createElement('div', { 
            key: 'modal', 
            className: 'modal fade show d-block', 
            tabIndex: '-1',
            style: { zIndex: 1055, display: 'block' },
            role: 'dialog'
        }, 
          React.createElement('div', { className: 'modal-dialog modal-dialog-centered' }, 
              React.createElement('div', { className: 'modal-content border-0 shadow-lg animate-fade-in overflow-hidden', style: { borderRadius: '20px' } }, [
                  // Modal Header
                  React.createElement('div', { className: 'modal-header border-bottom-0 bg-light' }, [
                      React.createElement('h5', { className: 'modal-title fw-bold' }, modalMode === 'add' ? 'Add New User' : 'Edit User'),
                      React.createElement('button', { type: 'button', className: 'btn-close', onClick: () => setShowModal(false) })
                  ]),
                  // Modal Body
                  React.createElement('div', { className: 'modal-body p-4' }, 
                      React.createElement('form', null, [
                          React.createElement('div', { className: 'mb-3' }, [
                              React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Full Name'),
                              React.createElement('input', { type: 'text', className: 'form-control form-control-modern', placeholder: 'e.g. John Doe', value: currentUser.name, onChange: e => setCurrentUser({...currentUser, name: e.target.value}) })
                          ]),
                          React.createElement('div', { className: 'mb-3' }, [
                              React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Email Address'),
                              React.createElement('input', { type: 'email', className: 'form-control form-control-modern', placeholder: 'e.g. john@example.com', value: currentUser.email, onChange: e => setCurrentUser({...currentUser, email: e.target.value}) })
                          ]),
                          React.createElement('div', { className: 'row' }, [
                              React.createElement('div', { className: 'col-md-6 mb-3' }, [
                                  React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Role'),
                                  React.createElement('select', { className: 'form-select form-control-modern', value: currentUser.role, onChange: e => setCurrentUser({...currentUser, role: e.target.value}) }, [
                                      React.createElement('option', { value: 'user' }, 'User'),
                                      React.createElement('option', { value: 'admin' }, 'Admin')
                                  ])
                              ]),
                              React.createElement('div', { className: 'col-md-6 mb-3' }, [
                                  React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Status'),
                                  React.createElement('div', { className: 'form-check form-switch mt-2' }, [
                                      React.createElement('input', { 
                                          type: 'checkbox', 
                                          className: 'form-check-input', 
                                          id: 'isActiveCheck', 
                                          checked: currentUser.isActive, 
                                          onChange: e => setCurrentUser({...currentUser, isActive: e.target.checked}) 
                                      }),
                                      React.createElement('label', { className: 'form-check-label small', htmlFor: 'isActiveCheck' }, currentUser.isActive ? 'Active' : 'Inactive')
                                  ])
                              ])
                          ]),
                          React.createElement('div', { className: 'mb-3' }, [
                              React.createElement('label', { className: 'form-label small fw-bold text-muted' }, modalMode === 'edit' ? 'New Password (Optional)' : 'Password'),
                              React.createElement('input', { type: 'password', className: 'form-control form-control-modern', placeholder: '••••••••', value: currentUser.password, onChange: e => setCurrentUser({...currentUser, password: e.target.value}) })
                          ])
                      ])
                  ),
                  // Modal Footer
                  React.createElement('div', { className: 'modal-footer border-top-0 bg-light' }, [
                      React.createElement('button', { type: 'button', className: 'btn btn-light rounded-pill px-4', onClick: () => setShowModal(false) }, 'Cancel'),
                      React.createElement('button', { type: 'button', className: 'btn btn-primary rounded-pill px-4 btn-primary-modern', onClick: handleSave }, 'Save Changes')
                  ])
              ])
          )
        ),
        document.body
      ),

      // Delete Confirmation Modal
      showDeleteModal && ReactDOM.createPortal(
        React.createElement('div', { 
            key: 'delete-modal', 
            className: 'modal fade show d-block', 
            tabIndex: '-1',
            style: { zIndex: 1060, display: 'block' },
            role: 'dialog'
        }, 
          React.createElement('div', { className: 'modal-dialog modal-dialog-centered modal-sm' }, 
              React.createElement('div', { className: 'modal-content border-0 shadow-lg animate-fade-in text-center p-4', style: { borderRadius: '24px' } }, [
                  React.createElement('div', { className: 'mb-3' }, 
                    React.createElement('div', { className: 'rounded-circle bg-danger bg-opacity-10 d-inline-flex align-items-center justify-content-center', style: { width: '64px', height: '64px' } },
                        React.createElement('i', { className: 'fa-solid fa-triangle-exclamation text-danger fs-3' })
                    )
                  ),
                  React.createElement('h5', { className: 'fw-bold mb-2' }, 'Delete User?'),
                  React.createElement('p', { className: 'text-muted small mb-4' }, `Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`),
                  React.createElement('div', { className: 'd-flex gap-2 justify-content-center' }, [
                      React.createElement('button', { type: 'button', className: 'btn btn-light rounded-pill px-4 w-50', onClick: () => setShowDeleteModal(false) }, 'Cancel'),
                      React.createElement('button', { type: 'button', className: 'btn btn-danger rounded-pill px-4 w-50', onClick: handleDelete }, 'Delete')
                  ])
              ])
          )
        ),
        document.body
      )
  ]);
}
