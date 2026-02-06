const React = window.React;
const { useState, useEffect, useRef, useCallback } = React;
import config from './config.js';

function Profile({ showToast, onProfileUpdate }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Activity Log State
    const [activityLogs, setActivityLogs] = useState([]);
    const [hasMoreLogs, setHasMoreLogs] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Default to 10
    
    // Observer ref to persist across renders
    const observer = useRef();

    // Fetch Config for Pagination Limit
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
                    const configList = data.data || (Array.isArray(data) ? data : []);
                    const paginationConfig = configList.find(c => c.configKey === 'pagination_limit');
                    if (paginationConfig) {
                        const limit = parseInt(paginationConfig.mainValue, 10);
                        if (!isNaN(limit) && limit > 0) {
                            setItemsPerPage(limit);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching pagination config:", err);
            }
        };
        fetchConfig();
    }, []);

    // Fetch Logs Function - Wrapped in useCallback
    const fetchLogs = useCallback(async (offset) => {
        if (loadingLogs) return;
        setLoadingLogs(true);
        
        try {
            const response = await fetch(`${config.api.baseUrl}/api/profile/activity?limit=${itemsPerPage}&offset=${offset}`, {
                headers: {
                    'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const newLogs = data.data || [];
                
                if (offset === 0) {
                    setActivityLogs(newLogs);
                } else {
                    setActivityLogs(prev => {
                        const existingIds = new Set(prev.map(l => l.id || l.ID));
                        const uniqueNewLogs = newLogs.filter(l => !existingIds.has(l.id || l.ID));
                        return [...prev, ...uniqueNewLogs];
                    });
                }
                
                if (newLogs.length < itemsPerPage) {
                    setHasMoreLogs(false);
                }
            } else {
                console.error("Failed to fetch logs:", response.status);
            }
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            setLoadingLogs(false);
        }
    }, [loadingLogs, itemsPerPage]);

    // Initial Fetch for Logs (Re-fetch when itemsPerPage changes)
    useEffect(() => {
        setActivityLogs([]);
        setHasMoreLogs(true);
        fetchLogs(0);
    }, [itemsPerPage]);

    // Infinite Scroll Observer Callback Ref (replaces observerTarget)
    const observerTarget = useCallback(node => {
        if (loadingLogs) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreLogs) {
                fetchLogs(activityLogs.length);
            }
        }, { threshold: 0.1, rootMargin: '100px' });
        
        if (node) observer.current.observe(node);
    }, [loadingLogs, hasMoreLogs, activityLogs.length, fetchLogs]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${config.api.baseUrl}/api/profile`, {
                    headers: {
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to load profile');
                }
                
                const data = await response.json();
                setProfile(data);
                localStorage.setItem('user', JSON.stringify(data));
                if (onProfileUpdate) onProfileUpdate(data);
            } catch (err) {
                console.error(err);
                if (showToast) showToast('Error loading profile', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const response = await fetch(`${config.api.baseUrl}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            if (showToast) showToast('Avatar updated successfully', 'success');
            
            // Re-fetch profile
            const profileRes = await fetch(`${config.api.baseUrl}/api/profile`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            const data = await profileRes.json();
            setProfile(data);
            localStorage.setItem('user', JSON.stringify(data));
            if (onProfileUpdate) onProfileUpdate(data);

        } catch (err) {
            console.error(err);
            if (showToast) showToast('Failed to upload avatar', 'error');
        }
    };

    const confirmRemoveAvatar = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`${config.api.baseUrl}/api/avatar/remove`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });

            if (!response.ok) throw new Error('Remove failed');

            if (showToast) showToast('Avatar removed successfully', 'success');

            // Re-fetch profile
            const profileRes = await fetch(`${config.api.baseUrl}/api/profile`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            const data = await profileRes.json();
            setProfile(data);
            localStorage.setItem('user', JSON.stringify(data));
            if (onProfileUpdate) onProfileUpdate(data);
            setShowConfirmModal(false);
        } catch (err) {
            console.error(err);
            if (showToast) showToast('Failed to remove avatar', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRemoveAvatar = () => {
        setShowConfirmModal(true);
    };

    if (loading) {
        return React.createElement('div', { className: 'text-center p-5' },
            React.createElement('div', { className: 'spinner-modern' })
        );
    }

    if (!profile) {
        return React.createElement('div', { className: 'alert alert-danger' }, 'Could not load profile data.');
    }

    return React.createElement('div', { className: 'container-fluid p-4 position-relative' },
        // Modal Overlay
        showConfirmModal && React.createElement('div', {
            className: 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center',
            style: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }
        },
            React.createElement('div', { className: 'modern-card p-4 shadow-lg animate-fade-in', style: { maxWidth: '400px', width: '90%' } }, [
                React.createElement('div', { className: 'text-center mb-4' }, [
                    React.createElement('div', { className: 'bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3', style: { width: '64px', height: '64px' } },
                        React.createElement('i', { className: 'fa-solid fa-trash-can text-danger fa-2x' })
                    ),
                    React.createElement('h4', { className: 'fw-bold mb-2' }, 'Remove Avatar?'),
                    React.createElement('p', { className: 'text-muted mb-0' }, 'Are you sure you want to remove your profile picture? This action cannot be undone.')
                ]),
                React.createElement('div', { className: 'd-flex gap-2' }, [
                    React.createElement('button', { 
                        className: 'btn btn-light flex-grow-1',
                        onClick: () => setShowConfirmModal(false),
                        disabled: isDeleting
                    }, 'Cancel'),
                    React.createElement('button', { 
                        className: 'btn btn-danger flex-grow-1',
                        onClick: confirmRemoveAvatar,
                        disabled: isDeleting
                    }, isDeleting ? 'Removing...' : 'Remove')
                ])
            ])
        ),

        // Main Content Wrapper (Animated)
        React.createElement('div', { className: 'animate-fade-in' }, [
            // Page Header
            React.createElement('div', { className: 'mb-4' },
                React.createElement('h2', { className: 'fw-bold mb-1' }, 'My Profile'),
                React.createElement('p', { className: 'text-muted' }, 'Manage your personal information and account settings.')
            ),

            React.createElement('div', { className: 'row g-4' }, [
                // Hero Card (Horizontal Layout)
            React.createElement('div', { key: 'hero', className: 'col-12' },
                React.createElement('div', { className: 'modern-card p-4 border-0 shadow-sm' }, 
                    React.createElement('div', { className: 'd-flex flex-column flex-md-row align-items-center align-items-md-start gap-4' }, [
                        // Avatar Section
                        React.createElement('div', { className: 'position-relative' }, [
                             React.createElement('img', {
                                src: profile.avatarType 
                                    ? `${config.api.baseUrl}/api/avatar?id=${profile.id}&t=${new Date().getTime()}` 
                                    : (profile.profilePicture 
                                        ? `${config.api.baseUrl}/uploads/${profile.profilePicture}` 
                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=random&color=fff&size=128`),
                                className: 'rounded-circle border border-1 border-secondary-subtle',
                                style: { width: '96px', height: '96px', objectFit: 'cover' },
                                alt: 'Profile'
                            }),
                            // Status Dot
                            React.createElement('div', {
                                className: `position-absolute bottom-0 end-0 border border-2 border-white rounded-circle bg-${profile.isActive ? 'success' : 'secondary'}`,
                                style: { width: '16px', height: '16px', marginRight: '6px', marginBottom: '6px' }
                            })
                        ]),
                        
                        // User Info Section
                        React.createElement('div', { className: 'flex-grow-1 text-center text-md-start' }, [
                            React.createElement('h3', { className: 'fw-bold mb-1' }, profile.name),
                            React.createElement('div', { className: 'text-muted mb-2' }, profile.email),
                            React.createElement('div', { className: 'd-flex align-items-center justify-content-center justify-content-md-start gap-2' }, [
                                React.createElement('span', { className: 'badge bg-primary bg-opacity-10 text-primary rounded-pill px-3' }, profile.role),
                                React.createElement('span', { className: 'badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3' }, 
                                    profile.isActive ? 'Active' : 'Inactive'
                                )
                            ])
                        ]),

                        // Actions Section (Buttons)
                        React.createElement('div', { className: 'd-flex flex-column gap-2' }, [
                            React.createElement('label', { className: 'btn btn-outline-primary btn-sm d-flex align-items-center gap-2 cursor-pointer' }, [
                                React.createElement('i', { className: 'fa-solid fa-camera' }),
                                'Change Picture',
                                React.createElement('input', {
                                    type: 'file',
                                    className: 'd-none',
                                    accept: 'image/*',
                                    onChange: handleFileChange
                                })
                            ]),
                            (profile.avatarType || profile.profilePicture) && React.createElement('button', {
                                className: 'btn btn-outline-danger btn-sm d-flex align-items-center gap-2',
                                onClick: handleRemoveAvatar
                            }, [
                                React.createElement('i', { className: 'fa-solid fa-trash' }),
                                'Remove Picture'
                            ])
                        ])
                    ])
                )
            ),

            // Details Section (Cards)
            React.createElement('div', { key: 'details', className: 'col-12' },
                React.createElement('div', { className: 'row g-4' }, [
                    // Account Info Card
                    React.createElement('div', { className: 'col-md-6' },
                        React.createElement('div', { className: 'modern-card h-100 border-0 shadow-sm p-4' }, [
                            React.createElement('h5', { className: 'fw-bold mb-4 border-bottom border-secondary border-opacity-25 pb-2' }, 'Account Details'),
                            
                            // List Items
                            React.createElement('div', { className: 'd-flex flex-column gap-3' }, [
                                React.createElement('div', { className: 'd-flex justify-content-between align-items-center' }, [
                                    React.createElement('span', { className: 'text-muted small text-uppercase fw-bold d-flex align-items-center gap-2' }, [
                                        React.createElement('i', { className: 'fa-regular fa-envelope text-primary opacity-75' }),
                                        'Email'
                                    ]),
                                    React.createElement('span', { className: 'fw-medium' }, profile.email)
                                ]),
                                React.createElement('div', { className: 'd-flex justify-content-between align-items-center' }, [
                                    React.createElement('span', { className: 'text-muted small text-uppercase fw-bold d-flex align-items-center gap-2' }, [
                                        React.createElement('i', { className: 'fa-solid fa-id-badge text-primary opacity-75' }),
                                        'Role'
                                    ]),
                                    React.createElement('span', { className: 'fw-medium' }, profile.role)
                                ]),
                                React.createElement('div', { className: 'd-flex justify-content-between align-items-center' }, [
                                    React.createElement('span', { className: 'text-muted small text-uppercase fw-bold d-flex align-items-center gap-2' }, [
                                        React.createElement('i', { className: 'fa-solid fa-toggle-on text-primary opacity-75' }),
                                        'Status'
                                    ]),
                                    React.createElement('span', { className: `fw-bold text-${profile.isActive ? 'success' : 'danger'}` }, 
                                        profile.isActive ? 'Active' : 'Suspended'
                                    )
                                ])
                            ])
                        ])
                    ),

                    // Security Info Card
                    React.createElement('div', { className: 'col-md-6' },
                        React.createElement('div', { className: 'modern-card h-100 border-0 shadow-sm p-4' }, [
                            React.createElement('h5', { className: 'fw-bold mb-4 border-bottom border-secondary border-opacity-25 pb-2' }, 'Security & Activity'),
                            
                            React.createElement('div', { className: 'd-flex flex-column gap-3' }, [
                                React.createElement('div', { className: 'd-flex justify-content-between align-items-center' }, [
                                    React.createElement('span', { className: 'text-muted small text-uppercase fw-bold d-flex align-items-center gap-2' }, [
                                        React.createElement('i', { className: 'fa-regular fa-clock text-success opacity-75' }),
                                        'Last Login'
                                    ]),
                                    React.createElement('span', { className: 'fw-medium' }, profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never')
                                ]),
                                React.createElement('div', { className: 'd-flex justify-content-between align-items-center' }, [
                                    React.createElement('span', { className: 'text-muted small text-uppercase fw-bold d-flex align-items-center gap-2' }, [
                                        React.createElement('i', { className: 'fa-solid fa-arrow-right-from-bracket text-warning opacity-75' }),
                                        'Last Logout'
                                    ]),
                                    React.createElement('span', { className: 'fw-medium' }, profile.lastLogout ? new Date(profile.lastLogout).toLocaleString() : 'Never')
                                ]),
                                React.createElement('div', { className: 'd-flex justify-content-between align-items-center' }, [
                                    React.createElement('span', { className: 'text-muted small text-uppercase fw-bold d-flex align-items-center gap-2' }, [
                                        React.createElement('i', { className: 'fa-solid fa-shield-halved text-danger opacity-75' }),
                                        'Failed Attempts'
                                    ]),
                                    React.createElement('span', { className: 'fw-medium' }, 
                                        `${profile.failedLoginAttempts || 0}`
                                    )
                                ])
                            ])
                        ])
                    )
                ])
            ),

            // Activity Logs Section
            React.createElement('div', { key: 'activity', className: 'col-12' },
                React.createElement('div', { className: 'modern-card border-0 shadow-sm p-4' }, [
                    React.createElement('div', { className: 'd-flex align-items-center justify-content-between mb-4 border-bottom border-secondary border-opacity-25 pb-3' }, [
                        React.createElement('h5', { className: 'fw-bold mb-0' }, 
                            React.createElement('i', { className: 'fa-solid fa-clock-rotate-left me-2 text-primary' }),
                            'Activity Log'
                        ),
                        React.createElement('span', { className: 'badge bg-secondary bg-opacity-10 text-secondary' }, 'Recent Activities')
                    ]),
                    
                    React.createElement('div', { className: 'position-relative ps-3' }, [
                        // Vertical Timeline Line
                        React.createElement('div', { 
                            className: 'position-absolute top-0 bottom-0 start-0 border-start border-secondary border-opacity-25',
                            style: { left: '15px' }
                        }),

                        activityLogs.length === 0 && !loadingLogs && React.createElement('div', { className: 'text-center text-muted p-3 ps-5' }, 'No activity logs found.'),
                        
                        activityLogs.map((log, index) => {
                            // Determine Icon and Color based on Action
                            let iconClass = 'fa-circle-info';
                            let colorClass = 'text-secondary';
                            let bgClass = 'bg-secondary';
                            
                            const action = log.action ? log.action.toUpperCase() : '';
                            
                            if (action.includes('LOGIN_FAILED')) {
                                iconClass = 'fa-shield-halved';
                                colorClass = 'text-danger';
                                bgClass = 'bg-danger';
                            } else if (action === 'LOGIN') {
                                iconClass = 'fa-right-to-bracket';
                                colorClass = 'text-success';
                                bgClass = 'bg-success';
                            } else if (action === 'LOGOUT') {
                                iconClass = 'fa-right-from-bracket';
                                colorClass = 'text-warning';
                                bgClass = 'bg-warning';
                            } else if (action.includes('UPDATE') || action.includes('PROFILE')) {
                                iconClass = 'fa-user-pen';
                                colorClass = 'text-primary';
                                bgClass = 'bg-primary';
                            } else if (action.includes('AVATAR')) {
                                iconClass = 'fa-image';
                                colorClass = 'text-info';
                                bgClass = 'bg-info';
                            } else if (action.includes('KICK')) {
                                iconClass = 'fa-ban';
                                colorClass = 'text-danger';
                                bgClass = 'bg-danger';
                            }

                            return React.createElement('div', { key: log.id || index, className: 'position-relative mb-4 ps-5 animate-fade-in' }, [
                                // Timeline Dot/Icon
                                React.createElement('div', { 
                                    className: `position-absolute d-flex align-items-center justify-content-center rounded-circle shadow-sm border border-secondary border-opacity-25`,
                                    style: { 
                                        width: '32px', 
                                        height: '32px', 
                                        left: '0', 
                                        top: '0',
                                        backgroundColor: 'var(--card-bg)', // Match card background to stand out from page
                                        zIndex: 1
                                    } 
                                }, 
                                    React.createElement('i', { className: `fa-solid ${iconClass} ${colorClass} small` })
                                ),

                                // Content Card
                                React.createElement('div', { 
                                    className: 'card border border-secondary border-opacity-10 shadow-sm rounded-3 overflow-hidden',
                                    style: { backgroundColor: 'var(--card-bg)' }
                                }, [
                                    React.createElement('div', { className: 'card-body p-3' }, [
                                        React.createElement('div', { className: 'd-flex justify-content-between align-items-start mb-1' }, [
                                            React.createElement('h6', { className: 'fw-bold mb-0 text-body' }, log.action),
                                            React.createElement('small', { className: 'text-muted ms-2 whitespace-nowrap' }, 
                                                React.createElement('i', { className: 'fa-regular fa-clock me-1' }),
                                                // Strip 'Z' to treat as Local Time
                                                new Date(log.createdAt.replace('Z', '')).toLocaleString(undefined, { 
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                                })
                                            )
                                        ]),
                                        React.createElement('p', { className: 'mb-0 text-secondary small opacity-75' }, log.details)
                                    ])
                                ])
                            ]);
                        }),
                        
                        loadingLogs && React.createElement('div', { className: 'text-center p-3 ps-5' }, 
                            React.createElement('div', { className: 'spinner-border spinner-border-sm text-primary' })
                        ),
                        
                        // Sentinel for Infinite Scroll
                        hasMoreLogs ? React.createElement('div', { 
                            ref: observerTarget, 
                            style: { height: '20px' } 
                        }) : React.createElement('div', { className: 'text-center p-3 text-muted small ps-5 opacity-50' }, 'No more activities')
                    ])
                ])
            )
        ])
    ]));
}

export default Profile;
