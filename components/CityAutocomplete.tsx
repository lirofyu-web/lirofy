// components/CityAutocomplete.tsx
import React, { useState, useEffect, useRef } from 'react';
import { brazilianCities } from '../data/brazilianCities';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  id: string;
  required?: boolean;
}

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({ value, onChange, id, required }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length > 1) {
      const filteredSuggestions = brazilianCities.filter(city =>
        city.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filteredSuggestions);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        id={id}
        value={value}
        onChange={handleInputChange}
        required={required}
        className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-2 cursor-pointer text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-500"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CityAutocomplete;