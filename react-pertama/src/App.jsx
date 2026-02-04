const React = window.React;
const { useState, useEffect } = React;
const $ = window.jQuery;
import config from '/src/config.js';
import Users from '/src/Users.jsx';
import Config from '/src/Config.jsx';
import ChangePassword from '/src/ChangePassword.jsx';
import Toast from '/src/Toast.jsx';
import ChangeLog from '/src/ChangeLog.jsx';
import Profile from '/src/Profile.jsx';
import Roles from '/src/Roles.jsx';
import Workspaces from '/src/Workspaces.jsx';
import Transactions from '/src/Transactions.jsx';
import Documentation from '/src/Documentation.jsx';
import UserSecurity from '/src/UserSecurity.jsx';

// --- Components ---

function Sidebar({ activeMenu, setActiveMenu, isCollapsed }) {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [hoveredMenu, setHoveredMenu] = useState(null); // { id: string, top: number }

  const toggleSubmenu = (id) => {
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge' },
    { id: 'workspaces', label: 'Workspaces', icon: 'fa-solid fa-building' },
    { id: 'transactions', label: 'Transactions', icon: 'fa-solid fa-money-bill-transfer' },
    { id: 'users', label: 'Users', icon: 'fa-solid fa-users' },
    { id: 'user-security', label: 'User Security', icon: 'fa-solid fa-user-lock' },
    { id: 'roles', label: 'Roles Access', icon: 'fa-solid fa-shield-halved' },

    { 
      id: 'settings', 
      label: 'Settings', 
      icon: 'fa-solid fa-gear',
      children: [
        { id: 'config', label: 'Config', icon: 'fa-solid fa-sliders' }
      ]
    },
    { id: 'changelog', label: 'Change Log', icon: 'fa-solid fa-code-branch' },
    { id: 'docs', label: 'Documentation', icon: 'fa-solid fa-book' },
    { id: 'support', label: 'Support', icon: 'fa-solid fa-headset' },
    { id: 'logs', label: 'System Logs', icon: 'fa-solid fa-file-code' }
  ];

  return React.createElement('div', { 
    className: `offcanvas-lg offcanvas-start sidebar-modern ${isCollapsed ? 'collapsed p-3' : 'p-4'}`, 
    tabIndex: '-1',
    id: 'sidebarMenu',
    'aria-labelledby': 'sidebarMenuLabel'
  }, [
    // Header
    React.createElement('div', { key: 'header', className: `d-flex align-items-center mb-4 ${isCollapsed ? 'justify-content-center' : ''} flex-shrink-0` }, [
      React.createElement('div', { key: 'logo-bg', className: `rounded-3 p-2 ${isCollapsed ? '' : 'me-2'}`, style: { background: 'var(--primary-gradient)', color: 'white' } },
        React.createElement('i', { className: 'fa-brands fa-react fa-xl' })
      ),
      !isCollapsed && React.createElement('span', { key: 'text', className: 'fs-4 fw-bold', style: { letterSpacing: '-0.5px' } }, 'AdminPanel')
    ]),
    
    // Scrollable Menu Area
    React.createElement('div', { 
      key: 'scroll-area', 
      className: 'flex-grow-1 overflow-auto custom-scrollbar',
      style: { margin: '0 -1rem', padding: '0 1rem' } // Compensate for parent padding to keep scrollbar at edge
    }, [
      !isCollapsed && React.createElement('div', { key: 'section-title', className: 'text-uppercase text-muted small fw-bold mb-3', style: { fontSize: '0.75rem' } }, 'Main Menu'),

      React.createElement('ul', { key: 'nav', className: 'nav flex-column mb-auto' }, 
        menuItems.map(item => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus[item.id];
          const isActive = activeMenu === item.id || (hasChildren && item.children.some(child => child.id === activeMenu));

          return React.createElement('li', { 
            key: item.id, 
            className: 'nav-item position-relative',
            onMouseEnter: (e) => {
              if (isCollapsed && hasChildren) {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredMenu({ id: item.id, top: rect.top });
              }
            },
            onMouseLeave: () => setHoveredMenu(null)
          }, [
            // Main Menu Item
            React.createElement('a', {
              key: 'link',
              href: '#',
              className: `nav-link-modern ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-content-center' : ''} d-flex align-items-center justify-content-between`,
              onClick: (e) => { 
                e.preventDefault(); 
                if (hasChildren && !isCollapsed) {
                  toggleSubmenu(item.id);
                } else {
                  setActiveMenu(item.id);
                }
              },
              'data-bs-dismiss': hasChildren ? undefined : 'offcanvas',
              'data-bs-target': hasChildren ? undefined : '#sidebarMenu',
              title: isCollapsed ? item.label : ''
            }, [
              React.createElement('div', { key: 'label-container', className: 'd-flex align-items-center' }, [
                React.createElement('i', { key: 'icon', className: `${item.icon} ${isCollapsed ? 'me-0' : 'me-3'}` }),
                !isCollapsed && React.createElement('span', { key: 'text' }, item.label)
              ]),
              // Arrow for submenu
              hasChildren && !isCollapsed && React.createElement('i', { 
                key: 'arrow',
                className: `fa-solid fa-chevron-right small transition-transform ${isExpanded ? 'rotate-90' : ''}`,
                style: { fontSize: '0.7rem', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }
              })
            ]),

            // Submenu (Accordion Style - Not Collapsed)
            hasChildren && !isCollapsed && React.createElement('div', {
              key: 'submenu',
              className: `submenu-wrapper ${isExpanded ? 'open' : ''}`,
              id: `submenu-${item.id}`
            }, 
              React.createElement('div', { className: 'submenu-inner' },
                React.createElement('ul', { className: 'nav flex-column ms-3 ps-3 border-start border-2' },
                  item.children.map(child => 
                    React.createElement('li', { key: child.id, className: 'nav-item' },
                      React.createElement('a', {
                        href: '#',
                        className: `nav-link-modern py-2 small ${activeMenu === child.id ? 'text-primary fw-bold' : 'text-muted'}`,
                        onClick: (e) => {
                          e.preventDefault();
                          setActiveMenu(child.id);
                        },
                        style: { background: 'transparent', boxShadow: 'none' }
                      }, [
                        child.icon && React.createElement('i', { key: 'icon', className: `${child.icon} me-2` }),
                        child.label
                      ])
                    )
                  )
                )
              )
            ),

            // Flyout Submenu (Collapsed Style - Hover)
            hasChildren && isCollapsed && hoveredMenu?.id === item.id && React.createElement('div', {
              key: 'flyout',
              className: 'flyout-menu animate-fade-in',
              style: { top: hoveredMenu.top }
            }, [
              React.createElement('div', { key: 'header', className: 'flyout-header' }, item.label),
              React.createElement('ul', { key: 'list', className: 'nav flex-column' }, 
                item.children.map(child => 
                  React.createElement('li', { key: child.id, className: 'nav-item' },
                    React.createElement('a', {
                      href: '#',
                      className: `nav-link-modern py-2 small ${activeMenu === child.id ? 'text-primary fw-bold' : ''}`,
                      onClick: (e) => {
                        e.preventDefault();
                        setActiveMenu(child.id);
                        setHoveredMenu(null); // Close flyout on selection
                      },
                      style: { background: 'transparent', boxShadow: 'none' }
                    }, [
                      child.icon && React.createElement('i', { key: 'icon', className: `${child.icon} me-2` }),
                      child.label
                    ])
                  )
                )
              )
            ])
          ]);
        })
      )
    ]),
    
    // Footer (Fixed at bottom)
    React.createElement('div', { key: 'footer', className: 'mt-auto pt-4 border-top flex-shrink-0' },
      isCollapsed 
        ? React.createElement('div', { className: 'd-flex justify-content-center p-2 rounded-3', style: { background: 'var(--bg-body)' } },
            React.createElement('i', { className: 'fa-solid fa-circle-info text-primary' })
          )
        : React.createElement('div', { className: 'd-flex align-items-center p-3 rounded-3', style: { background: 'var(--bg-body)' } }, [
            React.createElement('div', { key: 'icon', className: 'flex-shrink-0 me-3' },
              React.createElement('i', { className: 'fa-solid fa-circle-info text-primary' })
            ),
            React.createElement('div', { key: 'text', className: 'flex-grow-1' }, [
              React.createElement('h6', { key: 'title', className: 'mb-0 small fw-bold' }, 'Need Help?'),
              React.createElement('small', { key: 'desc', className: 'text-muted', style: { fontSize: '0.75rem' } }, 'Check our docs')
            ])
          ])
    )
  ]);
}

function Header({ title, onLogout, isDarkMode, toggleTheme, toggleSidebar, setActiveMenu, togglePasswordModal }) {
  // Dummy Notification Data
  const notifications = [
    { id: 1, title: 'New Order #1023', time: '5m ago', icon: 'fa-box', color: 'primary', unread: true },
    { id: 2, title: 'Server overloaded', time: '1h ago', icon: 'fa-server', color: 'danger', unread: true },
    { id: 3, title: 'New user registered', time: '3h ago', icon: 'fa-user-plus', color: 'success', unread: false },
    { id: 4, title: 'Weekly report ready', time: '1d ago', icon: 'fa-file-lines', color: 'info', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return React.createElement('nav', { 
    className: 'navbar navbar-expand-lg header-modern sticky-top px-3 py-3',
  },
    React.createElement('div', { className: 'container-fluid' }, [
      // Desktop Toggle Button
      React.createElement('button', {
        key: 'desktop-toggler',
        className: 'btn btn-link d-none d-lg-block me-3 text-decoration-none p-0',
        type: 'button',
        onClick: toggleSidebar
      }, React.createElement('i', { className: 'fa-solid fa-bars-staggered fs-4 text-primary' })),

      // Mobile Toggle Button
      React.createElement('button', {
        key: 'sidebar-toggler',
        className: 'btn btn-link d-lg-none me-3 text-decoration-none p-0',
        type: 'button',
        'data-bs-toggle': 'offcanvas',
        'data-bs-target': '#sidebarMenu',
        'aria-controls': 'sidebarMenu'
      }, React.createElement('i', { className: 'fa-solid fa-bars-staggered fs-4 text-primary' })),

      React.createElement('div', { key: 'title-wrapper' }, [
        React.createElement('h5', { key: 'h5', className: 'mb-0 fw-bold' }, title),
        React.createElement('small', { key: 'small', className: 'text-muted' }, 'Overview of your project')
      ]),
      
      React.createElement('button', {
        key: 'toggler',
        className: 'navbar-toggler border-0',
        type: 'button',
        'data-bs-toggle': 'collapse',
        'data-bs-target': '#navbarSupportedContent'
      }, React.createElement('i', { className: 'fa-solid fa-ellipsis-vertical' })),

      React.createElement('div', { key: 'collapse', className: 'collapse navbar-collapse', id: 'navbarSupportedContent' }, [
        React.createElement('ul', { className: 'navbar-nav ms-auto mb-2 mb-lg-0 align-items-center gap-3' }, React.Children.toArray([
          // Dark Mode
          React.createElement('li', { key: 'theme', className: 'nav-item' },
            React.createElement('button', { 
              className: 'btn btn-modern-light rounded-circle shadow-sm',
              style: { width: '40px', height: '40px' },
              onClick: toggleTheme
            }, isDarkMode ? React.createElement('i', { className: 'fa-solid fa-sun text-warning' }) : React.createElement('i', { className: 'fa-solid fa-moon text-primary' }))
          ),
          
          // Notifications
          React.createElement('li', { key: 'notif', className: 'nav-item dropdown' }, [
            React.createElement('button', { 
              key: 'btn',
              className: 'btn btn-modern-light rounded-circle shadow-sm position-relative',
              style: { width: '40px', height: '40px' },
              'data-bs-toggle': 'dropdown',
              'aria-expanded': 'false'
            }, [
              React.createElement('i', { key: 'icon', className: 'fa-regular fa-bell' }),
              unreadCount > 0 && React.createElement('span', { key: 'badge', className: 'position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle' })
            ]),
            React.createElement('ul', { key: 'menu', className: 'dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-0 notification-dropdown' }, React.Children.toArray([
              React.createElement('li', { key: 'header', className: 'p-0' }, 
                React.createElement('div', { className: 'd-flex justify-content-between align-items-center p-3 border-bottom' }, [
                  React.createElement('h6', { key: 'title', className: 'mb-0 fw-bold' }, 'Notifications'),
                  React.createElement('small', { key: 'action', className: 'text-primary cursor-pointer' }, 'Mark all read')
                ])
              ),
              React.createElement('li', { key: 'list', className: 'p-0' }, 
                React.createElement('div', { className: 'list-group list-group-flush' },
                  notifications.map(n => 
                    React.createElement('a', { 
                      key: n.id, 
                      href: '#', 
                      className: `list-group-item list-group-item-action p-3 d-flex align-items-start notification-item ${n.unread ? 'unread' : ''}` 
                    }, [
                      React.createElement('div', { key: 'icon', className: `rounded-circle p-2 bg-${n.color} bg-opacity-10 text-${n.color} me-3 flex-shrink-0` },
                        React.createElement('i', { className: `fa-solid ${n.icon}` })
                      ),
                      React.createElement('div', { key: 'content', className: 'flex-grow-1' }, [
                        React.createElement('div', { key: 'header', className: 'd-flex justify-content-between align-items-center mb-1' }, [
                          React.createElement('h6', { key: 'title', className: 'mb-0 small fw-bold' }, n.title),
                          React.createElement('small', { key: 'time', className: 'text-muted ms-2', style: { fontSize: '0.7rem' } }, n.time)
                        ]),
                        React.createElement('p', { key: 'desc', className: 'mb-0 text-muted small text-truncate', style: { maxWidth: '180px' } }, 'Click to view details...')
                      ])
                    ])
                  )
                )
              ),
              React.createElement('li', { key: 'footer', className: 'p-0' }, 
                React.createElement('div', { className: 'p-2 text-center border-top' },
                  React.createElement('a', { href: '#', className: 'small text-decoration-none fw-bold text-primary' }, 'View All Notifications')
                )
              )
            ]))
          ]),
          
          React.createElement('li', { key: 'sep', className: 'nav-item d-none d-lg-block' }, 
            React.createElement('div', { className: 'vr mx-2' })
          ),

          // User Dropdown
          React.createElement('li', { key: 'user', className: 'nav-item dropdown' }, [
            React.createElement('a', {
              key: 'link',
              className: 'nav-link dropdown-toggle d-flex align-items-center',
              href: '#',
              id: 'navbarDropdown',
              role: 'button',
              'data-bs-toggle': 'dropdown',
              'aria-expanded': 'false'
            }, [
              React.createElement('div', { key: 'info', className: 'd-none d-md-block text-end me-2' }, [
                React.createElement('div', { key: 'name', className: 'fw-bold small' }, 'Admin User'),
                React.createElement('div', { key: 'role', className: 'text-muted small', style: { fontSize: '0.7rem' } }, 'Super Admin')
              ]),
              React.createElement('img', {
                key: 'img',
                src: 'https://ui-avatars.com/api/?name=Admin+User&background=random&color=fff',
                className: 'rounded-circle shadow-sm',
                width: '40',
                height: '40',
                alt: 'User'
              })
            ]),
            React.createElement('ul', { key: 'menu', className: 'dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2', 'aria-labelledby': 'navbarDropdown' }, React.Children.toArray([
              React.createElement('li', { key: 'header' }, React.createElement('h6', { className: 'dropdown-header' }, 'Account Settings')),
              React.createElement('li', { key: 'profile' }, React.createElement('a', { 
                className: 'dropdown-item rounded-2', 
                href: '#',
                onClick: (e) => {
                  e.preventDefault();
                  setActiveMenu('profile');
                }
              }, [
                React.createElement('i', { key: 'icon', className: 'fa-regular fa-user me-2' }), 'My Profile'
              ])),
              React.createElement('li', { key: 'pw' }, React.createElement('a', { 
                className: 'dropdown-item rounded-2', 
                href: '#',
                onClick: (e) => {
                  e.preventDefault();
                  togglePasswordModal();
                }
              }, [
                React.createElement('i', { key: 'icon', className: 'fa-solid fa-lock me-2' }), 'Security'
              ])),
              React.createElement('li', { key: 'div' }, React.createElement('hr', { className: 'dropdown-divider my-2' })),
              React.createElement('li', { key: 'logout' }, 
                React.createElement('a', { 
                  className: 'dropdown-item text-danger rounded-2 fw-bold', 
                  href: '#', 
                  onClick: (e) => { e.preventDefault(); onLogout(); } 
                }, [
                  React.createElement('i', { key: 'icon', className: 'fa-solid fa-arrow-right-from-bracket me-2' }),
                  'Logout'
                ])
              )
            ]))
          ])
        ]))
      ])
    ])
  );
}

function DashboardStats() {
  const cards = [
    { title: 'Total Users', value: '1,234', icon: 'fa-users', trend: '+12%', color: 'primary' },
    { title: 'Revenue', value: '$45,678', icon: 'fa-sack-dollar', trend: '+5%', color: 'success' },
    { title: 'Tasks', value: '12', icon: 'fa-list-check', trend: '-2%', color: 'warning' },
    { title: 'Alerts', value: '3', icon: 'fa-triangle-exclamation', trend: '+1%', color: 'danger' }
  ];

  return React.createElement('div', { className: 'row g-4 mb-4' },
    cards.map((card, idx) => 
      React.createElement('div', { 
        key: idx, 
        className: 'col-12 col-md-6 col-xl-3 animate-fade-in',
        style: { animationDelay: `${idx * 0.1}s` }
      },
      React.createElement('div', { className: 'modern-card h-100 p-4' },
        React.createElement('div', { className: 'd-flex justify-content-between align-items-start mb-3' }, [
          React.createElement('div', { key: 'icon', className: `modern-icon-box bg-${card.color} bg-opacity-10 text-${card.color}` },
             React.createElement('i', { className: `fa-solid ${card.icon}` })
          ),
          React.createElement('span', { key: 'badge', className: `badge bg-${card.color} bg-opacity-10 text-${card.color} rounded-pill` }, card.trend)
        ]),
        React.createElement('h2', { className: 'fw-bold mb-1' }, card.value),
          React.createElement('p', { className: 'text-muted small mb-0' }, card.title)
        )
      )
    )
  );
}

function DashboardContent({ activeMenu, showToast }) {
  if (activeMenu === 'dashboard') {
    return React.createElement('div', { className: 'p-4' }, [
      React.createElement(DashboardStats, { key: 'stats' }),
      React.createElement('div', { key: 'chart', className: 'modern-card p-4 animate-fade-in animate-delay-300' }, [
        React.createElement('div', { key: 'header', className: 'd-flex justify-content-between align-items-center mb-4' }, [
          React.createElement('h5', { key: 'title', className: 'fw-bold mb-0' }, 'Recent Activity'),
          React.createElement('button', { key: 'btn', className: 'btn btn-sm btn-modern-light rounded-pill px-3' }, 'View All')
        ]),
        React.createElement('div', { key: 'placeholder', className: 'p-5 text-center bg-modern-subtle rounded-3 border border-dashed' },
          React.createElement('p', { key: 'text', className: 'text-muted mb-0' }, 'Chart Visualization Placeholder')
        )
      ])
    ]);
  }

  // Users and Settings components remain similar but wrapped in modern-card...
  if (activeMenu === 'workspaces') {
    return React.createElement(Workspaces, { showToast });
  }

  if (activeMenu === 'transactions') {
    return React.createElement(Transactions, { showToast });
  }

  if (activeMenu === 'users') {
    return React.createElement(Users, { showToast });
  }

  if (activeMenu === 'user-security') {
    return React.createElement(UserSecurity, { showToast });
  }

  if (activeMenu === 'roles') {
    return React.createElement(Roles, { showToast });
  }
  
  // Minimal placeholder for settings to keep it working
  if (activeMenu === 'settings') return React.createElement('div', { className: 'modern-card p-4 animate-fade-in' }, 'Settings Page');
  
  if (activeMenu === 'config') return React.createElement(Config, { showToast });

  if (activeMenu === 'changelog') return React.createElement(ChangeLog, { showToast });

  if (activeMenu === 'profile') return React.createElement(Profile, { showToast });

  if (activeMenu === 'docs') return React.createElement(Documentation, { showToast });
  
  return null;
}

function DashboardLayout({ onLogout, isDarkMode, toggleTheme, togglePasswordModal, showToast }) {
  // Initialize from localStorage to persist state across refreshes
  const [activeMenu, setActiveMenu] = useState(() => {
    return localStorage.getItem('activeMenu') || 'dashboard';
  });

  // Save to localStorage whenever activeMenu changes
  useEffect(() => {
    localStorage.setItem('activeMenu', activeMenu);
  }, [activeMenu]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return React.createElement('div', { className: 'd-flex', style: { height: '100vh', overflow: 'hidden' } }, [
    React.createElement(Sidebar, { 
      key: 'sidebar', 
      activeMenu: activeMenu, 
      setActiveMenu: setActiveMenu,
      isCollapsed: isSidebarCollapsed
    }),
    React.createElement('div', { 
      key: 'wrapper', 
      className: `flex-grow-1 layout-wrapper d-flex flex-column ${isSidebarCollapsed ? 'collapsed' : ''}`,
      style: { overflow: 'hidden' }
    }, [
      React.createElement(Header, { 
        key: 'header', 
        title: activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1), 
        onLogout: onLogout,
        isDarkMode: isDarkMode,
        toggleTheme: toggleTheme,
        toggleSidebar: toggleSidebar,
        setActiveMenu: setActiveMenu,
        togglePasswordModal: togglePasswordModal
      }),
      React.createElement('main', { 
        key: 'main', 
        className: 'flex-grow-1 overflow-auto custom-scrollbar', 
        style: { marginTop: '0' } 
      }, 
        React.createElement(DashboardContent, { activeMenu: activeMenu, showToast: showToast })
      )
    ])
  ]);
}

function LoginPage({ onLogin, isDarkMode, toggleTheme }) {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${config.api.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Scenario 2: Database/Server Error
      if (response.status === 500 || response.status === 503) {
        setError('Cannot connect to Database. Please contact administrator.');
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        // Scenario 3: Invalid Credentials (401) or other logic errors
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      // Scenario 1: Backend not reachable (Network Error)
      setError('Cannot connect to Backend Server. Is it running?');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return React.createElement('div', { 
    className: `d-flex align-items-center justify-content-center min-vh-100 login-bg` 
  },
    React.createElement('div', { className: 'container' },
      React.createElement('div', { className: 'row justify-content-center' },
        React.createElement('div', { className: 'col-md-5 col-lg-4' },
          React.createElement('div', { className: `glass-card p-4 p-md-5` }, [
            
            // Loading Overlay
            isLoading && React.createElement('div', { key: 'loading-overlay', className: 'loading-overlay', style: { zIndex: 20 } }, [
                React.createElement('div', { key: 'spinner', className: 'spinner-modern' }),
                React.createElement('div', { key: 'text', className: 'loading-text' }, 'SIGNING IN...')
            ]),

            React.createElement('div', { key: 'header', className: 'text-center mb-4' }, [
              React.createElement('div', { key: 'logo', className: 'd-inline-flex align-items-center justify-content-center bg-modern-subtle rounded-circle shadow-sm mb-3', style: { width: '64px', height: '64px' } },
                 React.createElement('i', { className: 'fa-brands fa-react fa-2x text-primary' })
              ),
              React.createElement('h3', { key: 'title', className: 'fw-bold mb-1' }, 'Welcome Back'),
              React.createElement('p', { key: 'subtitle', className: 'text-muted' }, 'Enter your credentials to access the admin.')
            ]),
            
            error && React.createElement('div', { key: 'error', className: 'alert alert-danger small py-2 mb-3' }, error),

            React.createElement('form', { key: 'form', onSubmit: handleSubmit }, [
              React.createElement('div', { key: 'u', className: 'mb-3' }, [
                React.createElement('label', { key: 'l', className: 'form-label small fw-bold text-muted ms-1' }, 'EMAIL'),
                React.createElement('input', {
                  key: 'i',
                  type: 'email', // Changed to email for better validation
                  className: 'form-control form-control-modern',
                  placeholder: 'name@example.com',
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  disabled: isLoading
                })
              ]),
              React.createElement('div', { key: 'p', className: 'mb-4' }, [
                React.createElement('label', { key: 'l', className: 'form-label small fw-bold text-muted ms-1' }, 'PASSWORD'),
                React.createElement('input', {
                  key: 'i',
                  type: 'password',
                  className: 'form-control form-control-modern',
                  placeholder: '••••••••',
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  disabled: isLoading
                })
              ]),
              React.createElement('button', { 
                key: 'btn', 
                type: 'submit', 
                className: 'btn btn-primary-modern w-100 py-3 shadow-sm',
                disabled: isLoading
              }, [
                isLoading ? 'Signing In...' : 'Sign In ',
                !isLoading && React.createElement('i', { key: 'icon', className: 'fa-solid fa-arrow-right ms-2' })
              ])
            ]),
            React.createElement('div', { key: 'footer', className: 'text-center mt-4' },
              React.createElement('button', { 
                className: 'btn btn-link text-decoration-none btn-sm text-muted',
                onClick: toggleTheme
              }, isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode')
            )
          ])
        )
      )
    )
  );
}

function LoadingScreen() {
  return React.createElement('div', { className: 'loading-screen' }, [
    React.createElement('div', { key: 'spinner', className: 'spinner-modern' }),
    React.createElement('div', { key: 'text', className: 'loading-text' }, 'LOADING...')
  ]);
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check login status on mount
  useEffect(() => {
    // Check theme preference immediately to avoid flash
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark');
    }

    // Simulate a brief loading check for better UX
    setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
      }
      setIsLoading(false);
    }, 800); // 0.8s delay for smooth animation
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const togglePasswordModal = () => {
    setIsPasswordModalOpen(!isPasswordModalOpen);
  };

  const handleLogin = (user) => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${config.api.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      
      // Small delay to show the loading screen briefly before showing login
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  if (isLoading) {
    return React.createElement(LoadingScreen);
  }

  if (!isLoggedIn) {
    return React.createElement(LoginPage, { 
      onLogin: handleLogin,
      isDarkMode: isDarkMode,
      toggleTheme: toggleTheme
    });
  }

  return React.createElement(React.Fragment, null, [
    React.createElement(DashboardLayout, { 
      key: 'layout',
      onLogout: handleLogout,
      isDarkMode: isDarkMode,
      toggleTheme: toggleTheme,
      togglePasswordModal: togglePasswordModal,
      showToast: showToast
    }),
    React.createElement(ChangePassword, { 
      key: 'pw-modal',
      isOpen: isPasswordModalOpen, 
      onClose: () => setIsPasswordModalOpen(false) 
    }),
    React.createElement(Toast, {
      key: 'toast-container',
      toasts: toasts,
      removeToast: removeToast
    })
  ]);
}

export default App;
