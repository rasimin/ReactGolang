const React = window.React;
const { useState } = React;

export default function Documentation() {
  const [activeTag, setActiveTag] = useState('Authentication');
  const [expandedEndpoints, setExpandedEndpoints] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const toggleEndpoint = (id) => {
    setExpandedEndpoints(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const apiDocs = [
    {
      tag: 'Authentication',
      description: 'User authentication and session management',
      endpoints: [
        {
          id: 'auth-login',
          method: 'POST',
          path: '/login',
          summary: 'User Login',
          description: 'Authenticates a user and returns a JWT token for session management.',
          requestBody: {
            email: 'admin@example.com',
            password: 'password123'
          },
          responses: {
            200: {
              success: true,
              token: "eyJhbGciOiJIUzI1NiIsIn...",
              user: { id: 1, name: "Admin", email: "admin@example.com", role: "admin" }
            },
            401: { success: false, message: "Invalid credentials" }
          }
        },
        {
          id: 'auth-logout',
          method: 'POST',
          path: '/logout',
          summary: 'User Logout',
          description: 'Invalidates the current session token.',
          headers: { Authorization: 'Bearer <token>' },
          responses: { 200: { message: "Logged out successfully" } }
        },
        {
          id: 'auth-change-password',
          method: 'POST',
          path: '/change-password',
          summary: 'Change Password',
          description: 'Updates the authenticated user\'s password.',
          headers: { Authorization: 'Bearer <token>' },
          requestBody: {
            oldPassword: 'currentPassword',
            newPassword: 'newPassword123'
          },
          responses: { 
            200: { message: "Password changed successfully" },
            400: { message: "New passwords do not match" }
          }
        }
      ]
    },
    {
      tag: 'Users',
      description: 'User account management',
      endpoints: [
        {
          id: 'users-list',
          method: 'GET',
          path: '/api/users',
          summary: 'List Users',
          description: 'Retrieve a paginated list of users with optional filtering.',
          headers: { Authorization: 'Bearer <token>' },
          queryParams: [
            { name: 'page', type: 'integer', description: 'Page number (default: 1)' },
            { name: 'limit', type: 'integer', description: 'Items per page (default: 10)' },
            { name: 'search', type: 'string', description: 'Search by name or email' },
            { name: 'roleId', type: 'integer', description: 'Filter by role ID' }
          ],
          responses: {
            200: {
              data: [
                { id: 1, name: "User 1", email: "user1@example.com", role: "admin", isActive: true }
              ],
              total: 50
            }
          }
        },
        {
          id: 'users-create',
          method: 'POST',
          path: '/api/users',
          summary: 'Create User',
          description: 'Create a new user account.',
          headers: { Authorization: 'Bearer <token>' },
          requestBody: {
            name: "New User",
            email: "newuser@example.com",
            password: "password123",
            role: "user",
            isActive: true
          },
          responses: { 200: { message: "User created successfully", id: 101 } }
        },
        {
          id: 'users-update',
          method: 'PUT',
          path: '/api/users/{id}',
          summary: 'Update User',
          description: 'Update an existing user account.',
          headers: { Authorization: 'Bearer <token>' },
          pathParams: [
            { name: 'id', type: 'integer', description: 'User ID' }
          ],
          requestBody: {
            name: "Updated Name",
            role: "manager",
            isActive: false
          },
          responses: { 200: { message: "User updated successfully" } }
        },
        {
          id: 'users-delete',
          method: 'DELETE',
          path: '/api/users/{id}',
          summary: 'Delete User',
          description: 'Permanently remove a user account.',
          headers: { Authorization: 'Bearer <token>' },
          pathParams: [
            { name: 'id', type: 'integer', description: 'User ID' }
          ],
          responses: { 200: { message: "User deleted successfully" } }
        }
      ]
    },
    {
      tag: 'Roles',
      description: 'Role-based access control management',
      endpoints: [
        {
          id: 'roles-list',
          method: 'GET',
          path: '/api/roles',
          summary: 'List Roles',
          description: 'Retrieve a paginated list of roles.',
          headers: { Authorization: 'Bearer <token>' },
          queryParams: [
            { name: 'page', type: 'integer', description: 'Page number (default: 1)' },
            { name: 'limit', type: 'integer', description: 'Items per page (default: 10)' },
            { name: 'search', type: 'string', description: 'Search by role name' }
          ],
          responses: {
            200: {
              data: [
                { id: 1, name: "Admin", description: "Full access", userCount: 5 }
              ],
              total: 3
            }
          }
        },
        {
          id: 'roles-create',
          method: 'POST',
          path: '/api/roles',
          summary: 'Create Role',
          description: 'Create a new role definition.',
          headers: { Authorization: 'Bearer <token>' },
          requestBody: {
            name: "Editor",
            description: "Can edit content"
          },
          responses: { 200: { message: "Role added successfully" } }
        },
        {
          id: 'roles-update',
          method: 'PUT',
          path: '/api/roles/{id}',
          summary: 'Update Role',
          description: 'Update an existing role.',
          headers: { Authorization: 'Bearer <token>' },
          pathParams: [
            { name: 'id', type: 'integer', description: 'Role ID' }
          ],
          requestBody: {
            name: "Senior Editor",
            description: "Can edit and publish"
          },
          responses: { 200: { message: "Role updated successfully" } }
        },
        {
          id: 'roles-delete',
          method: 'DELETE',
          path: '/api/roles/{id}',
          summary: 'Delete Role',
          description: 'Remove a role. May fail if users are assigned to it.',
          headers: { Authorization: 'Bearer <token>' },
          pathParams: [
            { name: 'id', type: 'integer', description: 'Role ID' }
          ],
          responses: { 200: { message: "Role deleted successfully" } }
        }
      ]
    },
    {
      tag: 'Configuration',
      description: 'System-wide configuration settings',
      endpoints: [
        {
          id: 'configs-list',
          method: 'GET',
          path: '/api/configs',
          summary: 'List Configs',
          description: 'Retrieve system configurations.',
          headers: { Authorization: 'Bearer <token>' },
          queryParams: [
            { name: 'page', type: 'integer', description: 'Page number' },
            { name: 'limit', type: 'integer', description: 'Items per page' },
            { name: 'search', type: 'string', description: 'Search by key' },
            { name: 'type', type: 'string', description: 'Filter by type (string, boolean, integer, json)' }
          ],
          responses: {
            200: {
              data: [
                { id: 1, configKey: "site_name", dataType: "string", mainValue: "AdminPanel", isActive: true }
              ],
              total: 10
            }
          }
        },
        {
          id: 'configs-create',
          method: 'POST',
          path: '/api/configs',
          summary: 'Create Config',
          description: 'Add a new configuration parameter.',
          headers: { Authorization: 'Bearer <token>' },
          requestBody: {
            configKey: "new_feature_enabled",
            dataType: "boolean",
            mainValue: "true",
            description: "Enable new feature"
          },
          responses: { 200: { message: "Config added successfully" } }
        },
        {
          id: 'configs-update',
          method: 'PUT',
          path: '/api/configs/{id}',
          summary: 'Update Config',
          description: 'Modify a configuration value.',
          headers: { Authorization: 'Bearer <token>' },
          pathParams: [
            { name: 'id', type: 'integer', description: 'Config ID' }
          ],
          requestBody: {
            mainValue: "false",
            description: "Disabled temporarily"
          },
          responses: { 200: { message: "Config updated successfully" } }
        },
        {
          id: 'configs-delete',
          method: 'DELETE',
          path: '/api/configs/{id}',
          summary: 'Delete Config',
          description: 'Remove a configuration parameter.',
          headers: { Authorization: 'Bearer <token>' },
          pathParams: [
            { name: 'id', type: 'integer', description: 'Config ID' }
          ],
          responses: { 200: { message: "Config deleted successfully" } }
        },
        {
          id: 'configs-history',
          method: 'GET',
          path: '/api/configs/{id}/history',
          summary: 'Config History',
          description: 'Get audit log for a specific configuration.',
          headers: { Authorization: 'Bearer <token>' },
          pathParams: [
            { name: 'id', type: 'integer', description: 'Config ID' }
          ],
          responses: {
            200: [
              { date: "2025-01-01", action: "Updated", user: "Admin", details: "Value changed from true to false" }
            ]
          }
        }
      ]
    },
    {
      tag: 'Profile',
      description: 'User profile information',
      endpoints: [
        {
          id: 'profile-get',
          method: 'GET',
          path: '/api/profile',
          summary: 'Get Profile',
          description: 'Retrieve current user profile details.',
          headers: { Authorization: 'Bearer <token>' },
          responses: {
            200: {
              id: 1,
              name: "Admin User",
              email: "admin@example.com",
              role: "admin",
              isActive: true,
              lastLogin: "2025-01-26T10:00:00Z"
            }
          }
        }
      ]
    },
    {
      tag: 'System',
      description: 'System logs and maintenance',
      endpoints: [
        {
          id: 'changelog-get',
          method: 'GET',
          path: '/api/changelog',
          summary: 'Get Change Log',
          description: 'Retrieve system deployment history/changelog.',
          headers: { Authorization: 'Bearer <token>' },
          responses: {
            200: [
              { hash: "abc1234", message: "Initial commit", date: "2025-01-01", author: "Dev" }
            ]
          }
        }
      ]
    }
  ];

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'primary';
      case 'POST': return 'success';
      case 'PUT': return 'warning';
      case 'DELETE': return 'danger';
      default: return 'secondary';
    }
  };

  const filteredDocs = React.useMemo(() => {
    if (!searchTerm) return apiDocs;
    return apiDocs.map(tag => {
      const tagMatches = tag.tag.toLowerCase().includes(searchTerm.toLowerCase());
      const matchingEndpoints = tag.endpoints.filter(e => 
        e.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (tagMatches || matchingEndpoints.length > 0) {
        return {
          ...tag,
          endpoints: tagMatches ? tag.endpoints : matchingEndpoints
        };
      }
      return null;
    }).filter(Boolean);
  }, [searchTerm, apiDocs]);

  return React.createElement('div', { className: 'd-flex h-100' }, [
    // Sidebar
    React.createElement('div', { 
      key: 'sidebar',
      className: 'modern-card border-end h-100 flex-shrink-0 d-none d-md-block custom-scrollbar rounded-0',
      style: { width: '280px', overflowY: 'auto' }
    }, [
      React.createElement('div', { className: 'p-4 border-bottom' }, [
        React.createElement('div', { className: 'mb-3' }, [
          React.createElement('h5', { className: 'fw-bold mb-1' }, 'API Reference'),
          React.createElement('small', { className: 'text-muted' }, 'v1.0.0')
        ]),
        // Search Input with Animation
        React.createElement('div', { 
          className: 'search-container-modern',
          style: { 
            width: isSearchFocused ? '100%' : '85%', 
            margin: '0 auto',
            padding: '0.5rem 1rem' 
          } 
        }, [
          React.createElement('i', { className: 'fa-solid fa-search text-muted small' }),
          React.createElement('input', {
            type: 'text',
            className: 'search-input-modern',
            placeholder: 'Search docs...',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            onFocus: () => setIsSearchFocused(true),
            onBlur: () => setIsSearchFocused(false)
          })
        ])
      ]),
      React.createElement('div', { className: 'list-group list-group-flush' },
        filteredDocs.map((tag, index) => 
          React.createElement('a', {
            key: tag.tag,
            href: '#',
            className: `list-group-item list-group-item-action py-3 px-4 border-0 ${activeTag === tag.tag ? 'bg-primary bg-opacity-10 text-primary fw-bold border-end border-4 border-primary' : 'text-muted bg-transparent'} animate-fade-in`,
            style: { animationDelay: `${index * 0.05}s` },
            onClick: (e) => {
              e.preventDefault();
              setActiveTag(tag.tag);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }, [
            React.createElement('div', { className: 'd-flex justify-content-between align-items-center' }, [
              React.createElement('span', null, tag.tag),
              React.createElement('span', { className: 'badge bg-secondary bg-opacity-10 text-secondary rounded-pill' }, tag.endpoints.length)
            ]),
            React.createElement('small', { className: 'd-block mt-1 fw-normal opacity-75 text-truncate' }, tag.description)
          ])
        )
      )
    ]),

    // Main Content
    React.createElement('div', { 
      key: 'content',
      className: 'flex-grow-1 h-100 overflow-auto custom-scrollbar p-4'
    }, [
      React.createElement('div', { className: 'container-fluid mw-100', style: { maxWidth: '1000px' } }, [
        // Header
        React.createElement('div', { className: 'mb-5' }, [
          React.createElement('h2', { className: 'fw-bold mb-2' }, activeTag),
          React.createElement('p', { className: 'text-muted lead' }, filteredDocs.find(t => t.tag === activeTag)?.description)
        ]),

        // Endpoints List
        React.createElement('div', { className: 'd-flex flex-column gap-4' },
          filteredDocs.find(t => t.tag === activeTag)?.endpoints.map(endpoint => {
            const isExpanded = expandedEndpoints[endpoint.id];
            const color = getMethodColor(endpoint.method);

            return React.createElement('div', { 
              key: endpoint.id, 
              className: `modern-card border-0 overflow-hidden shadow-sm ${isExpanded ? 'ring-2' : ''}`,
              style: { 
                transition: 'all 0.2s',
                boxShadow: isExpanded ? `0 0 0 2px var(--bs-${color})` : ''
              }
            }, [
              // Endpoint Header (Clickable)
              React.createElement('div', {
                className: 'd-flex align-items-center p-3 cursor-pointer hover-modern',
                onClick: () => toggleEndpoint(endpoint.id),
                style: { cursor: 'pointer' }
              }, [
                // Method Badge
                React.createElement('span', { 
                  className: `badge bg-${color} me-3 px-3 py-2 font-monospace`,
                  style: { minWidth: '80px', fontSize: '1rem' }
                }, endpoint.method),
                
                // Path
                React.createElement('span', { className: 'font-monospace fw-bold text-body me-3 fs-6' }, endpoint.path),
                
                // Summary
                React.createElement('span', { className: 'text-muted small me-auto d-none d-sm-inline' }, endpoint.summary),
                
                // Chevron
                React.createElement('i', { 
                  className: `fa-solid fa-chevron-down text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`,
                  style: { transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }
                })
              ]),

              // Expanded Details
              isExpanded && React.createElement('div', { className: 'border-top p-4 animate-fade-in' }, [
                // Description
                React.createElement('p', { className: 'text-muted mb-4' }, endpoint.description),

                // Request Section
                React.createElement('div', { className: 'row g-4' }, [
                  // Parameters & Headers
                  React.createElement('div', { className: 'col-lg-6' }, [
                    // Headers
                    endpoint.headers && React.createElement('div', { className: 'mb-4' }, [
                      React.createElement('h6', { className: 'fw-bold small text-uppercase text-muted mb-3' }, 'Headers'),
                      React.createElement('div', { className: 'bg-modern-subtle rounded-3 p-3 font-monospace small' },
                        Object.entries(endpoint.headers).map(([k, v]) => 
                          React.createElement('div', { key: k, className: 'd-flex' }, [
                            React.createElement('span', { className: 'text-danger me-2' }, `${k}:`),
                            React.createElement('span', { className: 'text-body' }, v)
                          ])
                        )
                      )
                    ]),

                    // Path/Query Params
                    (endpoint.queryParams || endpoint.pathParams) && React.createElement('div', { className: 'mb-4' }, [
                      React.createElement('h6', { className: 'fw-bold small text-uppercase text-muted mb-3' }, 'Parameters'),
                      React.createElement('div', { className: 'table-responsive' },
                        React.createElement('table', { className: 'table table-sm table-borderless small mb-0' }, [
                          React.createElement('thead', null, 
                            React.createElement('tr', { className: 'border-bottom' }, [
                              React.createElement('th', { className: 'ps-0' }, 'Name'),
                              React.createElement('th', null, 'In'),
                              React.createElement('th', null, 'Type'),
                              React.createElement('th', { className: 'text-end pe-0' }, 'Description')
                            ])
                          ),
                          React.createElement('tbody', null, [
                            ...(endpoint.pathParams || []).map(p => 
                              React.createElement('tr', { key: p.name }, [
                                React.createElement('td', { className: 'ps-0 fw-bold font-monospace text-primary' }, p.name),
                                React.createElement('td', null, 'path'),
                                React.createElement('td', { className: 'text-muted fst-italic' }, p.type),
                                React.createElement('td', { className: 'text-end pe-0' }, p.description)
                              ])
                            ),
                            ...(endpoint.queryParams || []).map(p => 
                              React.createElement('tr', { key: p.name }, [
                                React.createElement('td', { className: 'ps-0 fw-bold font-monospace' }, p.name),
                                React.createElement('td', null, 'query'),
                                React.createElement('td', { className: 'text-muted fst-italic' }, p.type),
                                React.createElement('td', { className: 'text-end pe-0' }, p.description)
                              ])
                            )
                          ])
                        ])
                      )
                    ])
                  ]),

                  // Body & Response
                  React.createElement('div', { className: 'col-lg-6' }, [
                    // Request Body
                    endpoint.requestBody && React.createElement('div', { className: 'mb-4' }, [
                      React.createElement('h6', { className: 'fw-bold small text-uppercase text-muted mb-3' }, [
                        'Request Body',
                        React.createElement('span', { className: 'badge text-bg-warning ms-2' }, 'JSON')
                      ]),
                      React.createElement('div', { className: 'position-relative' },
                        React.createElement('pre', { className: 'bg-dark text-light p-3 rounded-3 small mb-0 overflow-auto custom-scrollbar', style: { maxHeight: '200px' } },
                          JSON.stringify(endpoint.requestBody, null, 2)
                        )
                      )
                    ]),

                    // Responses
                    endpoint.responses && React.createElement('div', null, [
                      React.createElement('h6', { className: 'fw-bold small text-uppercase text-muted mb-3' }, 'Responses'),
                      React.createElement('div', { className: 'd-flex flex-column gap-3' },
                        Object.entries(endpoint.responses).map(([code, body]) => 
                          React.createElement('div', { key: code }, [
                            React.createElement('div', { className: 'd-flex align-items-center mb-2' }, [
                              React.createElement('span', { 
                                className: `badge ${code.startsWith('2') ? 'bg-success' : 'bg-danger'} me-2` 
                              }, code),
                              React.createElement('span', { className: 'small text-muted' }, code.startsWith('2') ? 'Success' : 'Error')
                            ]),
                            React.createElement('pre', { className: 'bg-modern-subtle border p-3 rounded-3 small mb-0 overflow-auto custom-scrollbar text-body', style: { maxHeight: '200px' } },
                              JSON.stringify(body, null, 2)
                            )
                          ])
                        )
                      )
                    ])
                  ])
                ])
              ])
            ]);
          })
        )
      ])
    ])
  ]);
}
