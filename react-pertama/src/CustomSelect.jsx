const React = window.React;
const { useState, useRef, useEffect } = React;

const CustomSelect = ({ options, value, onChange, placeholder, className, disabled, compact }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  return React.createElement('div', { 
    className: `custom-select-container ${className || ''} ${disabled ? 'disabled' : ''}`, 
    ref: containerRef 
  }, [
    React.createElement('div', { 
      key: 'trigger',
      className: `form-select-modern custom-select-trigger d-flex justify-content-between align-items-center ${compact ? 'compact' : ''} ${isOpen ? 'open' : ''} ${disabled ? 'bg-light text-muted cursor-not-allowed' : ''}`, 
      onClick: toggleOpen,
      style: disabled ? { cursor: 'not-allowed', opacity: 0.7 } : {}
    }, [
      React.createElement('span', { key: 'text', className: 'text-truncate' }, selectedOption ? selectedOption.label : placeholder),
      React.createElement('i', { 
        key: 'arrow',
        className: `fa-solid fa-chevron-down custom-select-arrow ${isOpen ? 'rotate' : ''}`
      })
    ]),
    
    isOpen && React.createElement('div', { 
      key: 'options',
      className: 'custom-select-options animate-dropdown' 
    }, 
      options.map(option => 
        React.createElement('div', { 
          key: option.value, 
          className: `custom-select-option ${option.value === value ? 'selected' : ''}`,
          onClick: () => handleSelect(option)
        }, option.label)
      )
    )
  ]);
};

export default CustomSelect;
