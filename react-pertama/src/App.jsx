const React = window.React;
const { useState, useEffect } = React;
const $ = window.jQuery;
import config from '/src/config.js';
import Users from '/src/Users.jsx';

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
    { id: 'users', label: 'Users', icon: 'fa-solid fa-users' },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: 'fa-solid fa-chart-pie',
      children: [
        { id: 'sales', label: 'Sales Report', icon: 'fa-solid fa-sack-dollar' },
        { id: 'traffic', label: 'Traffic Source', icon: 'fa-solid fa-globe' },
        { id: 'performance', label: 'Performance', icon: 'fa-solid fa-bolt' }
      ]
    },
    { 
      id: 'products', 
      label: 'Products', 
      icon: 'fa-solid fa-box',
      children: [
        { id: 'list', label: 'Product List', icon: 'fa-solid fa-list' },
        { id: 'categories', label: 'Categories', icon: 'fa-solid fa-tags' },
        { id: 'inventory', label: 'Inventory', icon: 'fa-solid fa-warehouse' }
      ]
    },
    { id: 'orders', label: 'Orders', icon: 'fa-solid fa-cart-shopping' },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
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
              React.createElement('div', { className: 'd-flex align-items-center' }, [
                React.createElement('i', { key: 'icon', className: `${item.icon} ${isCollapsed ? 'me-0' : 'me-3'}` }),
                !isCollapsed && item.label
              ]),
              // Arrow for submenu
              hasChildren && !isCollapsed && React.createElement('i', { 
                className: `fa-solid fa-chevron-right small transition-transform ${isExpanded ? 'rotate-90' : ''}`,
                style: { fontSize: '0.7rem', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }
              })
            ]),

            // Submenu (Accordion Style - Not Collapsed)
            hasChildren && !isCollapsed && React.createElement('div', {
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
                      }, child.label)
                    )
                  )
                )
              )
            ),

            // Flyout Submenu (Collapsed Style - Hover)
            hasChildren && isCollapsed && hoveredMenu?.id === item.id && React.createElement('div', {
              className: 'flyout-menu animate-fade-in',
              style: { top: hoveredMenu.top }
            }, [
              React.createElement('div', { className: 'flyout-header' }, item.label),
              React.createElement('ul', { className: 'nav flex-column' }, 
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
                    }, child.label)
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
            React.createElement('div', { className: 'flex-shrink-0 me-3' },
              React.createElement('i', { className: 'fa-solid fa-circle-info text-primary' })
            ),
            React.createElement('div', { className: 'flex-grow-1' },
              React.createElement('h6', { className: 'mb-0 small fw-bold' }, 'Need Help?'),
              React.createElement('small', { className: 'text-muted', style: { fontSize: '0.75rem' } }, 'Check our docs')
            )
          ])
    )
  ]);
}

function Header({ title, onLogout, isDarkMode, toggleTheme, toggleSidebar }) {
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
        React.createElement('h5', { className: 'mb-0 fw-bold' }, title),
        React.createElement('small', { className: 'text-muted' }, 'Overview of your project')
      ]),
      
      React.createElement('button', {
        key: 'toggler',
        className: 'navbar-toggler border-0',
        type: 'button',
        'data-bs-toggle': 'collapse',
        'data-bs-target': '#navbarSupportedContent'
      }, React.createElement('i', { className: 'fa-solid fa-ellipsis-vertical' })),

      React.createElement('div', { key: 'collapse', className: 'collapse navbar-collapse', id: 'navbarSupportedContent' }, [
        React.createElement('ul', { className: 'navbar-nav ms-auto mb-2 mb-lg-0 align-items-center gap-3' }, [
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
              className: 'btn btn-modern-light rounded-circle shadow-sm position-relative',
              style: { width: '40px', height: '40px' },
              'data-bs-toggle': 'dropdown',
              'aria-expanded': 'false'
            }, [
              React.createElement('i', { key: 'icon', className: 'fa-regular fa-bell' }),
              unreadCount > 0 && React.createElement('span', { key: 'badge', className: 'position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle' })
            ]),
            React.createElement('ul', { className: 'dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-0 notification-dropdown' }, [
              React.createElement('div', { key: 'header', className: 'd-flex justify-content-between align-items-center p-3 border-bottom' }, [
                React.createElement('h6', { className: 'mb-0 fw-bold' }, 'Notifications'),
                React.createElement('small', { className: 'text-primary cursor-pointer' }, 'Mark all read')
              ]),
              React.createElement('div', { key: 'list', className: 'list-group list-group-flush' },
                notifications.map(n => 
                  React.createElement('a', { 
                    key: n.id, 
                    href: '#', 
                    className: `list-group-item list-group-item-action p-3 d-flex align-items-start notification-item ${n.unread ? 'unread' : ''}` 
                  }, [
                    React.createElement('div', { className: `rounded-circle p-2 bg-${n.color} bg-opacity-10 text-${n.color} me-3 flex-shrink-0` },
                      React.createElement('i', { className: `fa-solid ${n.icon}` })
                    ),
                    React.createElement('div', { className: 'flex-grow-1' }, [
                      React.createElement('div', { className: 'd-flex justify-content-between align-items-center mb-1' }, [
                        React.createElement('h6', { className: 'mb-0 small fw-bold' }, n.title),
                        React.createElement('small', { className: 'text-muted ms-2', style: { fontSize: '0.7rem' } }, n.time)
                      ]),
                      React.createElement('p', { className: 'mb-0 text-muted small text-truncate', style: { maxWidth: '180px' } }, 'Click to view details...')
                    ])
                  ])
                )
              ),
              React.createElement('div', { key: 'footer', className: 'p-2 text-center border-top' },
                React.createElement('a', { href: '#', className: 'small text-decoration-none fw-bold text-primary' }, 'View All Notifications')
              )
            ])
          ]),
          
          React.createElement('div', { key: 'sep', className: 'vr d-none d-lg-block mx-2' }),

          // User Dropdown
          React.createElement('li', { key: 'user', className: 'nav-item dropdown' }, [
            React.createElement('a', {
              className: 'nav-link dropdown-toggle d-flex align-items-center',
              href: '#',
              id: 'navbarDropdown',
              role: 'button',
              'data-bs-toggle': 'dropdown',
              'aria-expanded': 'false'
            }, [
              React.createElement('div', { key: 'info', className: 'd-none d-md-block text-end me-2' }, [
                React.createElement('div', { className: 'fw-bold small' }, 'Admin User'),
                React.createElement('div', { className: 'text-muted small', style: { fontSize: '0.7rem' } }, 'Super Admin')
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
            React.createElement('ul', { key: 'menu', className: 'dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2', 'aria-labelledby': 'navbarDropdown' }, [
              React.createElement('li', { key: 'header' }, React.createElement('h6', { className: 'dropdown-header' }, 'Account Settings')),
              React.createElement('li', { key: 'profile' }, React.createElement('a', { className: 'dropdown-item rounded-2', href: '#' }, [
                React.createElement('i', { className: 'fa-regular fa-user me-2' }), 'My Profile'
              ])),
              React.createElement('li', { key: 'pw' }, React.createElement('a', { className: 'dropdown-item rounded-2', href: '#' }, [
                React.createElement('i', { className: 'fa-solid fa-lock me-2' }), 'Security'
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
            ])
          ])
        ])
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
          React.createElement('div', { className: `modern-icon-box bg-${card.color} bg-opacity-10 text-${card.color}` },
             React.createElement('i', { className: `fa-solid ${card.icon}` })
          ),
          React.createElement('span', { className: `badge bg-${card.color} bg-opacity-10 text-${card.color} rounded-pill` }, card.trend)
        ]),
        React.createElement('h2', { className: 'fw-bold mb-1' }, card.value),
          React.createElement('p', { className: 'text-muted small mb-0' }, card.title)
        )
      )
    )
  );
}

function DashboardContent({ activeMenu }) {
  if (activeMenu === 'dashboard') {
    return React.createElement('div', { className: 'p-4' }, [
      React.createElement(DashboardStats, { key: 'stats' }),
      React.createElement('div', { key: 'chart', className: 'modern-card p-4 animate-fade-in animate-delay-300' }, [
        React.createElement('div', { className: 'd-flex justify-content-between align-items-center mb-4' }, [
          React.createElement('h5', { className: 'fw-bold mb-0' }, 'Recent Activity'),
          React.createElement('button', { className: 'btn btn-sm btn-modern-light rounded-pill px-3' }, 'View All')
        ]),
        React.createElement('div', { className: 'p-5 text-center bg-modern-subtle rounded-3 border border-dashed' },
          React.createElement('p', { className: 'text-muted mb-0' }, 'Chart Visualization Placeholder')
        )
      ])
    ]);
  }

  // Users and Settings components remain similar but wrapped in modern-card...
  if (activeMenu === 'users') {
    return React.createElement(Users);
  }
  
  // Minimal placeholder for settings to keep it working
  if (activeMenu === 'settings') return React.createElement('div', { className: 'modern-card p-4 animate-fade-in' }, 'Settings Page');
  
  return null;
}

function DashboardLayout({ onLogout, isDarkMode, toggleTheme }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return React.createElement('div', { className: 'd-flex', style: { minHeight: '100vh' } }, [
    React.createElement(Sidebar, { 
      key: 'sidebar', 
      activeMenu: activeMenu, 
      setActiveMenu: setActiveMenu,
      isCollapsed: isSidebarCollapsed
    }),
    React.createElement('div', { 
      key: 'wrapper', 
      className: `flex-grow-1 layout-wrapper d-flex flex-column ${isSidebarCollapsed ? 'collapsed' : ''}` 
    }, [
      React.createElement(Header, { 
        key: 'header', 
        title: activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1), 
        onLogout: onLogout,
        isDarkMode: isDarkMode,
        toggleTheme: toggleTheme,
        toggleSidebar: toggleSidebar
      }),
      React.createElement('main', { 
        key: 'main', 
        className: 'flex-grow-1', // Removed padding to make content full width/height
        style: { marginTop: '0' } 
      }, 
        React.createElement(DashboardContent, { activeMenu: activeMenu })
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

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
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
            React.createElement('div', { key: 'header', className: 'text-center mb-4' }, [
              React.createElement('div', { className: 'd-inline-flex align-items-center justify-content-center bg-modern-subtle rounded-circle shadow-sm mb-3', style: { width: '64px', height: '64px' } },
                 React.createElement('i', { className: 'fa-brands fa-react fa-2x text-primary' })
              ),
              React.createElement('h3', { className: 'fw-bold mb-1' }, 'Welcome Back'),
              React.createElement('p', { className: 'text-muted' }, 'Enter your credentials to access the admin.')
            ]),
            
            error && React.createElement('div', { key: 'error', className: 'alert alert-danger small py-2 mb-3' }, error),

            React.createElement('form', { key: 'form', onSubmit: handleSubmit }, [
              React.createElement('div', { key: 'u', className: 'mb-3' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted ms-1' }, 'EMAIL'),
                React.createElement('input', {
                  type: 'email', // Changed to email for better validation
                  className: 'form-control form-control-modern',
                  placeholder: 'name@example.com',
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  disabled: isLoading
                })
              ]),
              React.createElement('div', { key: 'p', className: 'mb-4' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted ms-1' }, 'PASSWORD'),
                React.createElement('input', {
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
                !isLoading && React.createElement('i', { className: 'fa-solid fa-arrow-right ms-2' })
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    
    // Check theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark');
    }
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

  const handleLogin = (user) => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
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
    }
  };

  if (!isLoggedIn) {
    return React.createElement(LoginPage, { 
      onLogin: handleLogin,
      isDarkMode: isDarkMode,
      toggleTheme: toggleTheme
    });
  }

  return React.createElement(DashboardLayout, { 
    onLogout: handleLogout,
    isDarkMode: isDarkMode,
    toggleTheme: toggleTheme
  });
}

export default App;
