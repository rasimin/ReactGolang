const React = window.React;

/**
 * Modern Search Input Component
 * 
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Handler for input change (e.target.value)
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.isLoading - Whether to show loading spinner
 */
export default function SearchInput({ value, onChange, placeholder = 'Search...', isLoading = false }) {
  return React.createElement('div', { className: 'search-container-modern' }, [
    isLoading 
      ? React.createElement('div', { key: 'spinner', className: 'spinner-border text-primary spinner-border-sm me-2', role: 'status' })
      : React.createElement('i', { key: 'icon', className: 'fa-solid fa-magnifying-glass text-muted small' }),
    React.createElement('input', { 
      key: 'input',
      type: 'text', 
      className: 'search-input-modern', 
      placeholder: placeholder,
      value: value,
      onChange: onChange
    })
  ]);
}
