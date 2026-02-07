const React = window.React;
const { useState, useRef, useEffect } = React;

const CustomSelect = ({ options, value, onChange, placeholder, className, disabled, compact, searchable }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when opening
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current.focus(), 100);
      }
    }
  }, [isOpen]);

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
    }, [
      // Search Input
      searchable && React.createElement('div', {
        key: 'search',
        className: 'custom-select-search p-2 border-bottom'
      }, 
        React.createElement('input', {
          ref: searchInputRef,
          type: 'text',
          className: 'form-control form-control-sm custom-select-search-input',
          placeholder: 'Search...',
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          onClick: (e) => e.stopPropagation() // Prevent closing when clicking input
        })
      ),

      // Options List
      React.createElement('div', {
        key: 'list',
        className: 'custom-select-list',
        style: { maxHeight: '200px', overflowY: 'auto' }
      },
        filteredOptions.length > 0 ? filteredOptions.map(option => 
          React.createElement('div', { 
            key: option.value, 
            className: `custom-select-option ${option.value === value ? 'selected' : ''}`,
            onClick: () => handleSelect(option)
          }, option.label)
        ) : React.createElement('div', { key: 'no-results', className: 'p-2 text-center text-muted small' }, 'No results found')
      )
    ])
  ]);
};

export default CustomSelect;
