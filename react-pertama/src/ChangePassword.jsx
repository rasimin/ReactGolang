const React = window.React;
const { useState } = React;
import config from './config.js';

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

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
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'row justify-content-center' },
    React.createElement('div', { className: 'col-md-8 col-lg-6' },
      React.createElement('div', { className: 'modern-card p-4 animate-fade-in' }, [
        // Header
        React.createElement('div', { key: 'header', className: 'd-flex align-items-center mb-4' }, [
          React.createElement('div', { className: 'rounded-circle bg-primary bg-opacity-10 p-3 me-3 text-primary' },
            React.createElement('i', { className: 'fa-solid fa-lock fs-4' })
          ),
          React.createElement('div', null, [
            React.createElement('h5', { className: 'fw-bold mb-0' }, 'Change Password'),
            React.createElement('small', { className: 'text-muted' }, 'Update your password to keep your account secure')
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
              React.createElement('span', { className: 'input-group-text border-0 bg-light text-muted' }, 
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
              React.createElement('span', { className: 'input-group-text border-0 bg-light text-muted' }, 
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
              React.createElement('span', { className: 'input-group-text border-0 bg-light text-muted' }, 
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
          }, loading ? [
            React.createElement('span', { key: 'spinner', className: 'spinner-border spinner-border-sm me-2', role: 'status', 'aria-hidden': 'true' }),
            'Updating Password...'
          ] : 'Update Password')
        ])
      ])
    )
  );
}
