const React = window.React;
const { useState, useEffect } = React;
import config from './config.js';

function Profile({ showToast }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

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
            } catch (err) {
                console.error(err);
                if (showToast) showToast('Error loading profile', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return React.createElement('div', { className: 'text-center p-5' },
            React.createElement('div', { className: 'spinner-modern' })
        );
    }

    if (!profile) {
        return React.createElement('div', { className: 'alert alert-danger' }, 'Could not load profile data.');
    }

    return React.createElement('div', { className: 'container-fluid p-4 animate-fade-in' },
        // Page Header
        React.createElement('div', { className: 'mb-4' },
            React.createElement('h2', { className: 'fw-bold mb-1' }, 'My Profile'),
            React.createElement('p', { className: 'text-muted' }, 'Manage your personal information and account status.')
        ),

        React.createElement('div', { className: 'row g-4' }, [
            // Left Column: Main Identity Card
            React.createElement('div', { key: 'left', className: 'col-lg-4' },
                React.createElement('div', { className: 'modern-card overflow-hidden h-100 border-0 shadow-sm' }, [
                    // Banner
                    React.createElement('div', {
                        key: 'banner',
                        style: {
                            height: '140px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            position: 'relative'
                        }
                    }),
                    // Content Wrapper
                    React.createElement('div', { key: 'content', className: 'px-4 pb-4 text-center position-relative' }, [
                         // Avatar
                         React.createElement('div', { key: 'avatar-wrapper', className: 'd-inline-block position-relative', style: { marginTop: '-70px' } },
                            React.createElement('img', {
                                 src: profile.profilePicture ? `${config.api.baseUrl}/uploads/${profile.profilePicture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=random&color=fff&size=128`,
                                 className: 'rounded-circle border border-4 border-white shadow-lg',
                                 style: { width: '140px', height: '140px', objectFit: 'cover' },
                                 alt: 'Profile'
                            }),
                            // Status Indicator Dot
                            React.createElement('span', {
                                className: `position-absolute bottom-0 end-0 p-3 border border-4 border-white rounded-circle bg-${profile.isActive ? 'success' : 'secondary'}`,
                                style: { transform: 'translate(-10px, -10px)' }
                            })
                         ),
                         // Name & Role
                         React.createElement('h3', { key: 'name', className: 'fw-bold mt-3 mb-1' }, profile.name),
                         React.createElement('div', { key: 'role', className: 'badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3' }, profile.role),

                         // Status Text
                         React.createElement('div', { key: 'status-text', className: 'mt-2' },
                            React.createElement('span', { className: `text-${profile.isActive ? 'success' : 'muted'} small fw-bold` },
                                React.createElement('i', { className: 'fa-solid fa-circle me-2 small' }),
                                profile.isActive ? 'Active Account' : 'Inactive Account'
                            )
                         )
                    ])
                ])
            ),

            // Right Column: Details Grid
            React.createElement('div', { key: 'right', className: 'col-lg-8' },
                 React.createElement('div', { className: 'modern-card h-100 border-0 shadow-sm p-4' }, [
                     React.createElement('h5', { key: 'section-title', className: 'fw-bold mb-4 d-flex align-items-center' }, [
                        React.createElement('i', { key: 'icon', className: 'fa-regular fa-id-card me-3 text-primary' }),
                        'Account Information'
                     ]),

                     React.createElement('div', { key: 'grid', className: 'row g-3' }, [
                         // Email Item
                         React.createElement('div', { key: 'email', className: 'col-md-6' },
                            React.createElement('div', { className: 'p-3 rounded-3 bg-modern-subtle h-100' }, [
                                 React.createElement('small', { className: 'text-muted d-block mb-1 text-uppercase fw-bold' }, 'Email Address'),
                                 React.createElement('div', { className: 'd-flex align-items-center' }, [
                                     React.createElement('i', { className: 'fa-regular fa-envelope me-2 text-primary opacity-50' }),
                                     React.createElement('span', { className: 'fw-medium text-break' }, profile.email)
                                 ])
                            ])
                         ),
                         // Last Login
                          React.createElement('div', { key: 'last-login', className: 'col-md-6' },
                            React.createElement('div', { className: 'p-3 rounded-3 bg-modern-subtle h-100' }, [
                                 React.createElement('small', { className: 'text-muted d-block mb-1 text-uppercase fw-bold' }, 'Last Login'),
                                 React.createElement('div', { className: 'd-flex align-items-center' }, [
                                     React.createElement('i', { className: 'fa-regular fa-clock me-2 text-success opacity-50' }),
                                     React.createElement('span', { className: 'fw-medium' }, profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never')
                                 ])
                            ])
                         ),
                         // Last Logout
                         React.createElement('div', { key: 'last-logout', className: 'col-md-6' },
                            React.createElement('div', { className: 'p-3 rounded-3 bg-modern-subtle h-100' }, [
                                 React.createElement('small', { className: 'text-muted d-block mb-1 text-uppercase fw-bold' }, 'Last Logout'),
                                 React.createElement('div', { className: 'd-flex align-items-center' }, [
                                     React.createElement('i', { className: 'fa-solid fa-arrow-right-from-bracket me-2 text-warning opacity-50' }),
                                     React.createElement('span', { className: 'fw-medium' }, profile.lastLogout ? new Date(profile.lastLogout).toLocaleString() : 'Never')
                                 ])
                            ])
                         ),
                         // Failed Attempts
                         React.createElement('div', { key: 'attempts', className: 'col-md-6' },
                            React.createElement('div', { className: 'p-3 rounded-3 bg-modern-subtle h-100' }, [
                                 React.createElement('small', { className: 'text-muted d-block mb-1 text-uppercase fw-bold' }, 'Security Status'),
                                 React.createElement('div', { className: 'd-flex align-items-center' }, [
                                     React.createElement('i', { className: 'fa-solid fa-shield-halved me-2 text-danger opacity-50' }),
                                     React.createElement('span', { className: 'fw-medium' }, 
                                        `${profile.failedLoginAttempts || 0} Failed Attempts`
                                     )
                                 ])
                            ])
                         )
                     ])
                 ])
            )
        ])
    );
}

export default Profile;
