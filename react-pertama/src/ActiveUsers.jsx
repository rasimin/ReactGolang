const React = window.React;
const { useState, useEffect } = React;
import config from './config.js';

export default function ActiveUsers({ showToast, onLogout }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const fetchActiveUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${config.api.baseUrl}/api/users/active`, {
                headers: {
                    'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.data || []);
            } else {
                // If 401, it means token expired or kicked. 
                if (response.status === 401) {
                    if (onLogout) onLogout('Session expired. Please login again.');
                } else {
                    showToast('Failed to fetch active users', 'error');
                }
            }
        } catch (err) {
            console.error(err);
            showToast('Error fetching active users', 'error');
        } finally {
            setLoading(false);
            setIsFirstLoad(false);
        }
    };

    const handleKick = async (email) => {
        if (!confirm(`Are you sure you want to kick user ${email}?`)) return;

        try {
            const response = await fetch(`${config.api.baseUrl}/api/users/kick`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                showToast(`User ${email} has been kicked.`, 'success');
                fetchActiveUsers();
            } else {
                if (response.status === 401) {
                    if (onLogout) onLogout('Session expired.');
                    return;
                }
                const err = await response.json(); // Try JSON first
                showToast(err.message || 'Failed to kick user', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error kicking user', 'error');
        }
    };

    useEffect(() => {
        fetchActiveUsers();
        // Auto refresh every 30 seconds
        const interval = setInterval(fetchActiveUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isFirstLoad) {
        return React.createElement('div', { 
            className: 'd-flex justify-content-center align-items-center', 
            style: { height: '60vh' } 
        }, 
            React.createElement('div', { className: 'spinner-border text-primary', role: 'status' },
                React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
            )
        );
    }

    return React.createElement('div', { className: 'container-fluid p-4' }, [
        React.createElement('div', { key: 'header', className: 'd-flex justify-content-between align-items-center mb-4' }, [
            React.createElement('div', { key: 'title' }, [
                React.createElement('h2', { className: 'fw-bold mb-1' }, 'Active Sessions'),
                React.createElement('p', { className: 'text-muted mb-0' }, 'Monitor and manage currently logged-in users.')
            ]),
            React.createElement('button', {
                key: 'refresh',
                className: 'btn btn-modern-light',
                onClick: fetchActiveUsers
            }, [
                React.createElement('i', { className: 'fa-solid fa-rotate-right me-2', key: 'icon' }),
                'Refresh'
            ])
        ]),

        React.createElement('div', { key: 'card', className: 'modern-card' }, [
            React.createElement('div', { key: 'table-responsive', className: 'table-responsive' }, 
                React.createElement('table', { className: 'table table-hover align-middle mb-0' }, [
                    React.createElement('thead', { key: 'thead', className: 'bg-modern-subtle' }, 
                        React.createElement('tr', {}, [
                            React.createElement('th', { className: 'ps-4', key: 'th-user' }, 'User'),
                            React.createElement('th', { key: 'th-role' }, 'Role'),
                            React.createElement('th', { key: 'th-time' }, 'Login Time'),
                            React.createElement('th', { className: 'text-end pe-4', key: 'th-actions' }, 'Actions')
                        ])
                    ),
                    React.createElement('tbody', { key: 'tbody' }, 
                        users.length > 0 ? users.map(user => 
                            React.createElement('tr', { key: user.email }, [
                                React.createElement('td', { className: 'ps-4', key: 'td-user' }, [
                                    React.createElement('div', { className: 'd-flex align-items-center' }, [
                                        React.createElement('div', { 
                                            className: 'avatar-circle bg-primary text-white me-3 d-flex align-items-center justify-content-center',
                                            style: { width: '40px', height: '40px', fontSize: '1.2rem' }
                                        }, (user.name || '?').charAt(0).toUpperCase()),
                                        React.createElement('div', {}, [
                                            React.createElement('div', { className: 'fw-bold' }, user.name || 'Unknown'),
                                            React.createElement('div', { className: 'small text-muted' }, user.email)
                                        ])
                                    ])
                                ]),
                                React.createElement('td', { key: 'td-role' }, 
                                    React.createElement('span', { className: 'badge bg-modern-subtle text-primary' }, user.role || 'User')
                                ),
                                React.createElement('td', { key: 'td-time' }, 
                                    user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'
                                ),
                                React.createElement('td', { className: 'text-end pe-4', key: 'td-actions' }, 
                                    React.createElement('button', {
                                        className: 'btn btn-sm btn-danger rounded-pill px-3',
                                        onClick: () => handleKick(user.email)
                                    }, [
                                        React.createElement('i', { className: 'fa-solid fa-power-off me-2', key: 'icon-kick' }),
                                        'Kick'
                                    ])
                                )
                            ])
                        ) : React.createElement('tr', { key: 'no-data' }, 
                            React.createElement('td', { colSpan: 4, className: 'text-center py-5 text-muted' }, 'No active users found')
                        )
                    )
                ])
            )
        ])
    ]);
}
