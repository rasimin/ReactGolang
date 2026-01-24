const React = window.React;
const ReactDOM = window.ReactDOM;
const { useState, useEffect } = React;
import config from './config.js';

export default function ChangePassword({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(config.api.baseUrl + '/change-password', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      
      // Close modal after success after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    React.createElement('div', { 
        className: 'modal fade show d-block', 
        tabIndex: '-1', 
        style: { zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' },
        role: 'dialog'
    }, 
      React.createElement('div', { className: 'modal-dialog modal-dialog-centered' }, 
        React.createElement('div', { className: 'modal-content border-0 shadow-lg animate-fade-in overflow-hidden', style: { borderRadius: '20px' } }, [
          
          // Loading Overlay
          loading && React.createElement('div', { key: 'loading-overlay', className: 'loading-overlay', style: { zIndex: 10 } }, [
              React.createElement('div', { key: 'spinner', className: 'spinner-modern' }),
              React.createElement('div', { key: 'text', className: 'loading-text' }, 'PROCESSING...')
          ]),

          // Modal Header
          React.createElement('div', { className: 'modal-header border-bottom-0 bg-modern-subtle' }, [
            React.createElement('h5', { className: 'modal-title fw-bold' }, 'Change Password'),
            React.createElement('button', { type: 'button', className: 'btn-close', onClick: onClose })
          ]),

          // Modal Body
          React.createElement('div', { className: 'modal-body p-4' }, [
            // Header Icon & Text
            React.createElement('div', { key: 'header-info', className: 'd-flex align-items-center mb-4' }, [
              React.createElement('div', { className: 'rounded-circle bg-primary bg-opacity-10 p-3 me-3 text-primary' },
                React.createElement('i', { className: 'fa-solid fa-lock fs-4' })
              ),
              React.createElement('div', null, [
                React.createElement('small', { className: 'text-muted d-block' }, 'Update your password to keep your account secure')
              ])
            ]),

            // Alert Message
            message && React.createElement('div', { 
              key: 'alert', 
              className: `alert alert-${message.type === 'success' ? 'success' : 'danger'} d-flex align-items-center mb-4`,
              role: 'alert'
            }, [
              React.createElement('i', { className: `fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} me-2` }),
              React.createElement('div', null, message.text)
            ]),

            // Form
            React.createElement('form', { key: 'form', onSubmit: handleSubmit }, [
              // Current Password
              React.createElement('div', { key: 'current', className: 'mb-3' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Current Password'),
                React.createElement('div', { className: 'input-group' }, [
                  React.createElement('span', { className: 'input-group-text border-0 bg-modern-subtle text-muted' }, 
                    React.createElement('i', { className: 'fa-solid fa-key' })
                  ),
                  React.createElement('input', {
                    type: 'password',
                    className: 'form-control form-control-modern',
                    name: 'oldPassword',
                    value: formData.oldPassword,
                    onChange: handleChange,
                    required: true,
                    placeholder: 'Enter current password'
                  })
                ])
              ]),

              // New Password
              React.createElement('div', { key: 'new', className: 'mb-3' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'New Password'),
                React.createElement('div', { className: 'input-group' }, [
                  React.createElement('span', { className: 'input-group-text border-0 bg-modern-subtle text-muted' }, 
                    React.createElement('i', { className: 'fa-solid fa-lock' })
                  ),
                  React.createElement('input', {
                    type: 'password',
                    className: 'form-control form-control-modern',
                    name: 'newPassword',
                    value: formData.newPassword,
                    onChange: handleChange,
                    required: true,
                    placeholder: 'Enter new password'
                  })
                ])
              ]),

              // Confirm Password
              React.createElement('div', { key: 'confirm', className: 'mb-4' }, [
                React.createElement('label', { className: 'form-label small fw-bold text-muted' }, 'Confirm New Password'),
                React.createElement('div', { className: 'input-group' }, [
                  React.createElement('span', { className: 'input-group-text border-0 bg-modern-subtle text-muted' }, 
                    React.createElement('i', { className: 'fa-solid fa-check-double' })
                  ),
                  React.createElement('input', {
                    type: 'password',
                    className: 'form-control form-control-modern',
                    name: 'confirmPassword',
                    value: formData.confirmPassword,
                    onChange: handleChange,
                    required: true,
                    placeholder: 'Confirm new password'
                  })
                ])
              ]),

              // Submit Button
              React.createElement('button', {
                type: 'submit',
                className: 'btn btn-primary w-100 py-2 btn-primary-modern',
                disabled: loading
              }, loading ? 'Updating...' : 'Update Password')
            ])
          ])
        ])
      )
    ),
    document.body
  );
}
