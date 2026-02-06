const React = window.React;
const { useState, useEffect } = React;
import config from './config.js';

function Profile({ showToast, onProfileUpdate }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    return React.createElement('div', { className: 'container-fluid p-4 animate-fade-in position-relative' },
        // Modal Overlay
        showConfirmModal && React.createElement('div', {
            className: 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center',
            style: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }
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
                            React.createElement('h5', { className: 'fw-bold mb-4 border-bottom pb-2' }, 'Account Details'),
                            
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
                            React.createElement('h5', { className: 'fw-bold mb-4 border-bottom pb-2' }, 'Security & Activity'),
                            
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
            )
        ])
    );
}

export default Profile;
