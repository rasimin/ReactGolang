const React = window.React;
const { useState, useEffect } = React;
import Pagination from './Pagination.jsx';
import SearchInput from './SearchInput.jsx';
import config from './config.js';
import CustomSelect from './CustomSelect.jsx';

export default function UserSecurity({ showToast }) {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Reset Counter Modal State
  const [showResetCounterModal, setShowResetCounterModal] = useState(false);
  const [userToResetCounter, setUserToResetCounter] = useState(null);

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
      let fetchedUsers = data.data || [];
      
      // Client-side filtering for status if backend doesn't support it in this endpoint yet
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        fetchedUsers = fetchedUsers.filter(u => u.isActive === isActive);
      }
      
      setUsers(fetchedUsers);
      setTotalUsers(data.total || 0);
      setIsFirstLoad(false);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message);
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery, statusFilter]);

  const openResetCounterModal = (user) => {
    setUserToResetCounter(user);
    setShowResetCounterModal(true);
  };

  const confirmResetCounter = async () => {
    if (!userToResetCounter) return;

    try {
      const response = await fetch(`${config.api.baseUrl}/api/users/reset-counter`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: userToResetCounter.id })
      });

      if (!response.ok) throw new Error('Failed to reset counter');

      showToast('Login failed counter reset successfully', 'success');
      fetchUsers();
      setShowResetCounterModal(false);
      setUserToResetCounter(null);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
        showToast('Password cannot be empty', 'warning');
        return;
    }

    try {
      const payload = {
        id: selectedUser.id,
        email: selectedUser.email,
        name: selectedUser.name,
        role: selectedUser.role,
        roleId: selectedUser.roleId,
        isActive: selectedUser.isActive,
        password: newPassword
      };

      const response = await fetch(`${config.api.baseUrl}/api/users`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to reset password');

      showToast('Password reset successfully', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  if (isFirstLoad) {
    return React.createElement('div', { className: 'd-flex justify-content-center align-items-center vh-100' },
      React.createElement('div', { className: 'spinner-border text-primary', role: 'status' },
        React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
      )
    );
  }

  return React.createElement('div', { className: 'container-fluid p-4 animate-fade-in' }, [
    // Header
    React.createElement('div', { key: 'header', className: 'd-flex justify-content-between align-items-center mb-4' }, [
      React.createElement('div', null, [
        React.createElement('h2', { className: 'fw-bold text-body mb-1' }, 'User Security'),
        React.createElement('p', { className: 'text-muted mb-0' }, 'Manage passwords and login security')
      ])
    ]),

    // Filters
    React.createElement('div', { key: 'filters', className: 'card modern-card border-0 shadow-sm mb-4' },
      React.createElement('div', { className: 'card-body p-3' },
        React.createElement('div', { className: 'row g-3 align-items-center' }, [
          // Search
          React.createElement('div', { key: 'search', className: 'col-md-4' },
            React.createElement(SearchInput, {
              value: searchQuery,
              onChange: handleSearchChange,
              placeholder: "Search users..."
            })
          ),
          // Status Filter
          React.createElement('div', { key: 'status', className: 'col-md-3' },
            React.createElement(CustomSelect, {
                options: [
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                ],
                value: statusFilter,
                onChange: setStatusFilter,
                placeholder: "Filter Status",
                compact: true
            })
          )
        ])
      )
    ),

    // Table
    React.createElement('div', { key: 'table-card', className: 'card modern-card border-0 shadow-sm' }, [
      React.createElement('div', { className: 'card-body p-0' },
        React.createElement('div', { className: 'table-responsive' },
          React.createElement('table', { className: 'table table-hover align-middle mb-0' }, [
            React.createElement('thead', { className: 'bg-modern-subtle' },
              React.createElement('tr', null, [
                React.createElement('th', { className: 'ps-4 py-3 text-secondary' }, 'User'),
                React.createElement('th', { className: 'py-3 text-secondary' }, 'Role'),
                React.createElement('th', { className: 'py-3 text-secondary' }, 'Status'),
                React.createElement('th', { className: 'py-3 text-center text-secondary' }, 'Failed Attempts'),
                React.createElement('th', { className: 'pe-4 py-3 text-end text-secondary' }, 'Actions')
              ])
            ),
            React.createElement('tbody', null,
              loading ? (
                React.createElement('tr', null,
                  React.createElement('td', { colSpan: 5, className: 'text-center py-5' },
                    React.createElement('div', { className: 'spinner-border text-primary', role: 'status' },
                      React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
                    )
                  )
                )
              ) : users.length === 0 ? (
                React.createElement('tr', null,
                  React.createElement('td', { colSpan: 5, className: 'text-center py-5 text-muted' }, 'No users found')
                )
              ) : (
                users.map(user => 
                  React.createElement('tr', { key: user.id }, [
                    React.createElement('td', { className: 'ps-4' },
                        React.createElement('div', { className: 'd-flex align-items-center' }, [
                            React.createElement('div', { 
                                className: 'rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center me-3',
                                style: { width: '40px', height: '40px', fontSize: '1.2rem' }
                            }, user.name.charAt(0).toUpperCase()),
                            React.createElement('div', null, [
                                React.createElement('div', { className: 'fw-bold text-body' }, user.name),
                                React.createElement('div', { className: 'small text-muted' }, user.email)
                            ])
                        ])
                    ),
                    React.createElement('td', null,
                        React.createElement('span', { className: 'badge bg-modern-subtle text-body border' }, user.role)
                    ),
                    React.createElement('td', null,
                        React.createElement('span', { 
                            className: `badge rounded-pill ${user.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`
                        }, user.isActive ? 'Active' : 'Inactive')
                    ),
                    React.createElement('td', { className: 'text-center' },
                        React.createElement('span', { 
                            className: `badge ${user.failedLoginAttempts > 0 ? 'bg-warning text-dark' : 'bg-secondary bg-opacity-25 text-secondary'}`
                        }, user.failedLoginAttempts || 0)
                    ),
                    React.createElement('td', { className: 'pe-4 text-end' },
                        React.createElement('div', { className: 'd-flex gap-2 justify-content-end' }, [
                            React.createElement('button', {
                                className: 'btn btn-sm btn-outline-warning d-flex align-items-center gap-2',
                                onClick: () => openResetCounterModal(user),
                                title: 'Reset Failed Login Counter'
                            }, [
                                React.createElement('i', { className: 'fa-solid fa-rotate-left' }),
                                'Reset Counter'
                            ]),
                            React.createElement('button', {
                                className: 'btn btn-sm btn-outline-danger d-flex align-items-center gap-2',
                                onClick: () => openPasswordModal(user),
                                title: 'Reset Password'
                            }, [
                                React.createElement('i', { className: 'fa-solid fa-key' }),
                                'Reset Pwd'
                            ])
                        ])
                    )
                  ])
                )
              )
            )
          ])
        )
      ),
      // Pagination
      React.createElement('div', { className: 'card-footer bg-transparent border-top-0 py-3' },
        React.createElement(Pagination, {
            currentPage: currentPage,
            totalPages: totalPages,
            totalItems: totalUsers,
            itemsPerPage: itemsPerPage,
            indexOfFirstItem: indexOfFirstItem,
            indexOfLastItem: indexOfLastItem,
            onPageChange: setCurrentPage
        })
      )
    ]),

    // Password Reset Modal
    showPasswordModal && window.ReactDOM.createPortal(
        React.createElement('div', { className: 'modal fade show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }, tabIndex: '-1' },
            React.createElement('div', { className: 'modal-dialog modal-dialog-centered' },
                React.createElement('div', { className: 'modal-content modern-card border-0' }, [
                    React.createElement('div', { className: 'modal-header border-0' }, [
                        React.createElement('h5', { className: 'modal-title fw-bold' }, 'Reset Password'),
                        React.createElement('button', { type: 'button', className: 'btn-close', onClick: () => setShowPasswordModal(false) })
                    ]),
                    React.createElement('form', { onSubmit: handleResetPassword }, [
                        React.createElement('div', { className: 'modal-body' }, [
                            React.createElement('div', { className: 'alert alert-info' }, 
                                `Resetting password for ${selectedUser?.name} (${selectedUser?.email})`
                            ),
                            React.createElement('div', { className: 'mb-3' }, [
                                React.createElement('label', { className: 'form-label' }, 'New Password'),
                                React.createElement('input', {
                                    type: 'password',
                                    className: 'form-control form-control-modern',
                                    value: newPassword,
                                    onChange: (e) => setNewPassword(e.target.value),
                                    placeholder: 'Enter new password',
                                    required: true
                                })
                            ])
                        ]),
                        React.createElement('div', { className: 'modal-footer border-0' }, [
                            React.createElement('button', { 
                                type: 'button', 
                                className: 'btn btn-light btn-modern-light', 
                                onClick: () => setShowPasswordModal(false) 
                            }, 'Cancel'),
                            React.createElement('button', { 
                                type: 'submit', 
                                className: 'btn btn-primary btn-modern-primary' 
                            }, 'Reset Password')
                        ])
                    ])
                ])
            )
        ), document.body
    ),

    // Reset Counter Confirmation Modal
    showResetCounterModal && window.ReactDOM.createPortal(
        React.createElement('div', { className: 'modal fade show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }, tabIndex: '-1' },
            React.createElement('div', { className: 'modal-dialog modal-dialog-centered' },
                React.createElement('div', { className: 'modal-content modern-card border-0 shadow-lg' }, [
                    React.createElement('div', { className: 'modal-header border-0 pb-0' }, [
                        React.createElement('h5', { className: 'modal-title fw-bold text-warning' }, 
                            React.createElement('i', { className: 'fa-solid fa-triangle-exclamation me-2' }),
                            'Confirm Reset'
                        ),
                        React.createElement('button', { type: 'button', className: 'btn-close', onClick: () => setShowResetCounterModal(false) })
                    ]),
                    React.createElement('div', { className: 'modal-body py-4' }, [
                        React.createElement('p', { className: 'mb-0 text-muted fs-6' }, [
                            'Are you sure you want to reset failed login attempts for ',
                            React.createElement('strong', { className: 'text-body' }, userToResetCounter?.name),
                            '?'
                        ]),
                        React.createElement('p', { className: 'small text-muted mt-2 mb-0' }, 'This will unlock the account if it was locked due to too many failed attempts.')
                    ]),
                    React.createElement('div', { className: 'modal-footer border-0 pt-0' }, [
                        React.createElement('button', { 
                            type: 'button', 
                            className: 'btn btn-light btn-modern-light', 
                            onClick: () => setShowResetCounterModal(false) 
                        }, 'Cancel'),
                        React.createElement('button', { 
                            type: 'button', 
                            className: 'btn btn-warning text-white',
                            onClick: confirmResetCounter
                        }, [
                            React.createElement('i', { className: 'fa-solid fa-rotate-left me-2' }),
                            'Reset Counter'
                        ])
                    ])
                ])
            )
        ), document.body
    )
  ]);
}