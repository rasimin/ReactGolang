const React = window.React;
const { useEffect } = React;

export default function Toast({ toasts, removeToast }) {
  // Auto remove toast handled by parent or useEffect here?
  // Let's handle generic cleanup here just in case, or rely on parent.
  // Parent approach is better for state consistency.
  
  return React.createElement('div', {
    className: 'toast-container position-fixed top-0 end-0 p-3',
    style: { zIndex: 1100 }
  },
    toasts.map(toast => 
      React.createElement('div', {
        key: toast.id,
        className: `toast show align-items-center text-white bg-${toast.type === 'error' ? 'danger' : toast.type === 'success' ? 'success' : 'primary'} border-0 mb-2 animate-slide-in`,
        role: 'alert',
        'aria-live': 'assertive',
        'aria-atomic': 'true',
        style: { minWidth: '250px' }
      },
        React.createElement('div', { className: 'd-flex' }, [
          React.createElement('div', { key: 'body', className: 'toast-body d-flex align-items-center' }, [
            React.createElement('i', { key: 'icon', className: `fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'} me-2` }),
            React.createElement('span', { key: 'msg' }, toast.message)
          ]),
          React.createElement('button', {
            key: 'close',
            type: 'button',
            className: 'btn-close btn-close-white me-2 m-auto',
            'data-bs-dismiss': 'toast',
            'aria-label': 'Close',
            onClick: () => removeToast(toast.id)
          })
        ])
      )
    )
  );
}
