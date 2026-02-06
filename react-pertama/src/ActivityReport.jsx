const React = window.React;
const { useState, useEffect } = React;
import Pagination from './Pagination.jsx';
import SearchInput from './SearchInput.jsx';
import CustomSelect from './CustomSelect.jsx';
import config from './config.js';

export default function ActivityReport({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(0); // 0 = All Users
  
  // Get local date string (YYYY-MM-DD)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(getTodayDate()); // Default today local
  const [endDate, setEndDate] = useState(getTodayDate()); // Default today local

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Users for Filter Dropdown
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${config.api.baseUrl}/api/users?page=1&limit=100`, {
        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        userId: selectedUser,
        startDate: startDate,
        endDate: endDate
      });

      const response = await fetch(`${config.api.baseUrl}/api/activity-logs?${queryParams}`, {
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const data = await response.json();
      setLogs(data.data || []);
      setTotalLogs(data.total || 0);
      setIsFirstLoad(false);
    } catch (err) {
      console.error("Fetch logs error:", err);
      showToast('Failed to load activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, itemsPerPage, debouncedSearch, selectedUser, startDate, endDate]);

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setCurrentPage(1);
  };

  if (isFirstLoad && loading) {
    return React.createElement('div', { className: 'd-flex justify-content-center align-items-center', style: { minHeight: '400px' } },
      React.createElement('div', { className: 'spinner-border text-primary', role: 'status' },
        React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
      )
    );
  }

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  return React.createElement('div', { className: 'container-fluid p-4 animate-fade-in' }, [
    // Compact Filter Bar (No Header)
    React.createElement('div', { key: 'filters', className: 'd-flex flex-wrap gap-3 align-items-center mb-4' }, [
      // User Filter
      React.createElement('div', { key: 'user-filter', style: { width: '200px' } },
        React.createElement(CustomSelect, {
          key: 'select',
          options: [
            { value: 0, label: 'All Users' },
            ...users.map(u => ({ value: u.id, label: u.name }))
          ],
          value: selectedUser,
          onChange: (val) => {
            setSelectedUser(val);
            setCurrentPage(1);
          },
          placeholder: "Select User",
          compact: true
        })
      ),
      // Start Date Filter
      React.createElement('div', { key: 'start-date', style: { width: '160px' } },
        React.createElement('input', {
          key: 'input',
          type: 'date',
          className: 'form-control form-control-compact',
          value: startDate,
          onChange: handleStartDateChange,
          title: 'Start Date'
        })
      ),
      // End Date Filter
      React.createElement('div', { key: 'end-date', style: { width: '160px' } },
        React.createElement('input', {
          key: 'input',
          type: 'date',
          className: 'form-control form-control-compact',
          value: endDate,
          onChange: handleEndDateChange,
          title: 'End Date'
        })
      ),
      // Refresh Button
      React.createElement('button', { 
        key: 'refresh', 
        className: 'btn btn-light btn-modern-light rounded-pill px-3', 
        style: { height: '42px' },
        onClick: fetchLogs,
        title: 'Refresh Data'
      }, 
        React.createElement('i', { className: 'fa-solid fa-rotate' })
      ),
      // Search (Moved to right)
      React.createElement('div', { key: 'search', className: 'flex-grow-1 ms-auto', style: { maxWidth: '300px' } }, 
        React.createElement(SearchInput, {
          key: 'input',
          value: searchQuery,
          onChange: (e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          },
          placeholder: 'Search action or details...'
        })
      )
    ]),

    // Table Card
    React.createElement('div', { key: 'table-card', className: 'modern-card p-0 overflow-hidden animate-delay-100' }, [
      // Loading Overlay
      loading && !isFirstLoad && React.createElement('div', {
        key: 'overlay',
        className: 'position-absolute w-100 h-100 d-flex justify-content-center align-items-center bg-body-tertiary bg-opacity-75',
        style: { zIndex: 5 }
      },
        React.createElement('div', { className: 'spinner-border text-primary', role: 'status' })
      ),
      
      // Table
      React.createElement('div', { key: 'table-responsive', className: 'table-responsive' },
        React.createElement('table', { className: 'table table-hover align-middle mb-0' }, [
          React.createElement('thead', { key: 'thead', className: 'border-bottom' },
            React.createElement('tr', null, [
              React.createElement('th', { key: 'id', className: 'ps-4 py-3 text-uppercase text-muted small fw-bold', style: {width: '5%'} }, '#'),
              React.createElement('th', { key: 'user', className: 'py-3 text-uppercase text-muted small fw-bold', style: {width: '20%'} }, 'User'),
              React.createElement('th', { key: 'action', className: 'py-3 text-uppercase text-muted small fw-bold', style: {width: '20%'} }, 'Action'),
              React.createElement('th', { key: 'details', className: 'py-3 text-uppercase text-muted small fw-bold', style: {width: '35%'} }, 'Details'),
              React.createElement('th', { key: 'time', className: 'py-3 text-uppercase text-muted small fw-bold', style: {width: '20%'} }, 'Time')
            ])
          ),
          React.createElement('tbody', { key: 'tbody' },
            logs.length > 0 ? logs.map((log) => 
              React.createElement('tr', { key: log.id }, [
                React.createElement('td', { key: 'id', className: 'ps-4 text-muted' }, `#${log.id}`),
                React.createElement('td', { key: 'user' },
                  React.createElement('div', { className: 'd-flex align-items-center' }, [
                    React.createElement('div', { key: 'avatar', className: 'avatar-circle-sm bg-primary-subtle text-primary me-2' },
                      log.userName ? log.userName.charAt(0).toUpperCase() : '?'
                    ),
                    React.createElement('div', { key: 'info' }, [
                      React.createElement('div', { key: 'name', className: 'fw-medium text-dark' }, log.userName || 'Unknown'),
                      React.createElement('div', { key: 'email', className: 'small text-muted' }, log.userEmail)
                    ])
                  ])
                ),
                React.createElement('td', { key: 'action' },
                  React.createElement('span', { className: 'badge bg-primary-subtle text-primary rounded-pill px-3' }, log.action)
                ),
                React.createElement('td', { key: 'details', className: 'text-secondary' }, log.details),
                React.createElement('td', { key: 'time', className: 'text-muted small' },
                  new Date(log.createdAt).toLocaleString()
                )
              ])
            ) : React.createElement('tr', { key: 'empty' },
              React.createElement('td', { colSpan: 5, className: 'text-center py-5 text-muted' }, [
                React.createElement('div', { key: 'icon', className: 'mb-2' },
                  React.createElement('i', { className: 'fa-regular fa-folder-open fa-2x' })
                ),
                'No activity logs found matching criteria'
              ])
            )
          )
        ])
      ),

      // Pagination
      React.createElement('div', { key: 'pagination', className: 'p-3' },
        React.createElement(Pagination, {
          currentPage: currentPage,
          totalPages: totalPages,
          onPageChange: setCurrentPage,
          totalItems: totalLogs,
          indexOfFirstItem: (currentPage - 1) * itemsPerPage,
          indexOfLastItem: currentPage * itemsPerPage
        })
      )
    ])
  ]);
}
