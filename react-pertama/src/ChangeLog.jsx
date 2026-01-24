const React = window.React;
const { useState, useEffect } = React;
import config from './config.js';

export default function ChangeLog({ showToast }) {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChangeLog = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.api.baseUrl}/api/changelog`, {
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
      });
      if (!response.ok) throw new Error('Failed to fetch change log');
      const data = await response.json();
      setCommits(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
      if (showToast) showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChangeLog();
  }, []);

  if (loading) return React.createElement('div', { className: 'd-flex justify-content-center align-items-center p-5', style: { minHeight: '400px' } }, 
      React.createElement('div', { className: 'spinner-modern' })
  );

  return React.createElement('div', { className: 'container-fluid p-4' }, [
    React.createElement('div', { key: 'header', className: 'd-flex justify-content-between align-items-center mb-4' }, [
      React.createElement('div', { key: 'title-group' }, [
        React.createElement('h4', { key: 'title', className: 'fw-bold mb-1' }, 'System Change Log'),
        React.createElement('p', { key: 'subtitle', className: 'text-muted mb-0' }, 'History of all updates and improvements')
      ]),
      React.createElement('button', { 
        key: 'refresh', 
        className: 'btn btn-modern-light',
        onClick: fetchChangeLog 
      }, [
          React.createElement('i', { key: 'icon', className: 'fa-solid fa-rotate-right me-2' }), 
          'Refresh'
      ])
    ]),

    React.createElement('div', { key: 'timeline', className: 'position-relative' }, [
        // Timeline line
        React.createElement('div', { 
            key: 'line', 
            className: 'position-absolute top-0 bottom-0 start-0 ms-4 border-start border-2 border-primary border-opacity-25',
            style: { zIndex: 0 }
        }),

        commits.map((commit, index) => 
            React.createElement('div', { key: commit.hash, className: 'position-relative ps-5 mb-4 animate-fade-in', style: { animationDelay: `${index * 0.05}s` } }, [
                // Dot
                React.createElement('div', { 
                    key: 'dot',
                    className: 'position-absolute start-0 top-0 mt-1 ms-3 bg-white border border-4 border-primary rounded-circle shadow-sm',
                    style: { width: '16px', height: '16px', zIndex: 1 }
                }),
                
                // Card
                React.createElement('div', { key: 'card', className: 'modern-card p-3 shadow-sm hover-elevate' }, [
                    React.createElement('div', { key: 'header', className: 'd-flex justify-content-between align-items-start mb-2' }, [
                        React.createElement('h6', { key: 'msg', className: 'fw-bold mb-0 text-primary' }, commit.message),
                        React.createElement('span', { key: 'date', className: 'badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10' }, new Date(commit.date).toLocaleString())
                    ]),
                    React.createElement('div', { key: 'meta', className: 'd-flex align-items-center text-muted small' }, [
                         React.createElement('i', { key: 'icon-user', className: 'fa-solid fa-user-circle me-2' }),
                         React.createElement('span', { key: 'author', className: 'me-3 fw-medium' }, commit.author),
                         React.createElement('i', { key: 'icon-hash', className: 'fa-solid fa-code-commit me-2 ms-2' }),
                         React.createElement('span', { key: 'hash', className: 'font-monospace' }, commit.hash.substring(0, 7))
                    ])
                ])
            ])
        )
    ])
  ]);
}
