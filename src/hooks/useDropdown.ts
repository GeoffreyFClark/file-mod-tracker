import { useState, useEffect, RefObject } from 'react';

const useDropdown = (buttonRef: RefObject<HTMLButtonElement>, dropdownRef: RefObject<HTMLDivElement>) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [buttonRef, dropdownRef]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return [isOpen, toggleDropdown] as const;
};

export default useDropdown;