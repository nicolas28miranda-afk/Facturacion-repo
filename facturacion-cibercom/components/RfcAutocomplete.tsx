import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { clienteCatalogoService, ClienteDatos } from '../services/clienteCatalogoService';

interface RfcAutocompleteProps {
  value: string;
  onChange: (rfc: string) => void;
  onSelect: (cliente: ClienteDatos) => void;
  onNotFound: () => void;
  disabled?: boolean;
  required?: boolean;
}

interface RfcSuggestion {
  rfc: string;
  razonSocial?: string;
  nombre?: string;
}

export const RfcAutocomplete: React.FC<RfcAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  onNotFound,
  disabled = false,
  required = false,
}) => {
  const [suggestions, setSuggestions] = useState<RfcSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  // Buscar sugerencias mientras se escribe
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const rfc = value.trim().toUpperCase();
    
    if (rfc.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    timeoutRef.current = window.setTimeout(async () => {
      try {
        // Buscar RFCs que coincidan con el texto ingresado usando el servicio
        const clientes = await clienteCatalogoService.buscarClientesPorRFCParcial(rfc);
        if (clientes && clientes.length > 0) {
          const suggestionsData = clientes.slice(0, 10).map(c => ({
            rfc: c.rfc,
            razonSocial: c.razonSocial,
            nombre: c.nombre,
          }));
          setSuggestions(suggestionsData);
          setShowSuggestions(suggestionsData.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error al buscar RFCs:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce de 300ms

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  // Manejar búsqueda manual con botón
  const handleSearch = async () => {
    const rfc = value.trim().toUpperCase();
    if (!rfc || rfc.length < 3) {
      alert('Ingrese al menos 3 caracteres para buscar');
      return;
    }

    setIsSearching(true);
    try {
      // Primero intentar búsqueda exacta
      let result = await clienteCatalogoService.buscarClientePorRFC(rfc);
      
      // Si no se encuentra con búsqueda exacta, intentar búsqueda parcial
      if (!result.encontrado || !result.cliente) {
        const clientesParciales = await clienteCatalogoService.buscarClientesPorRFCParcial(rfc, 1);
        if (clientesParciales && clientesParciales.length > 0) {
          // Buscar coincidencia exacta en los resultados parciales
          const clienteExacto = clientesParciales.find(c => c.rfc.toUpperCase() === rfc);
          if (clienteExacto) {
            // Si encontramos coincidencia exacta, obtener datos completos
            result = await clienteCatalogoService.buscarClientePorRFC(clienteExacto.rfc);
            if (!result.encontrado && clienteExacto) {
              // Si aún no se encuentra, usar los datos parciales
              onSelect(clienteExacto);
              setShowSuggestions(false);
              setIsSearching(false);
              return;
            }
          } else if (clientesParciales.length === 1) {
            // Si solo hay un resultado parcial y es muy similar, usarlo
            const clienteSimilar = clientesParciales[0];
            if (clienteSimilar.rfc.toUpperCase().includes(rfc) || rfc.includes(clienteSimilar.rfc.toUpperCase())) {
              result = await clienteCatalogoService.buscarClientePorRFC(clienteSimilar.rfc);
              if (!result.encontrado && clienteSimilar) {
                onSelect(clienteSimilar);
                setShowSuggestions(false);
                setIsSearching(false);
                return;
              }
            }
          }
        }
      }
      
      if (result.encontrado && result.cliente) {
        onSelect(result.cliente);
        setShowSuggestions(false);
      } else {
        onNotFound();
      }
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      onNotFound();
    } finally {
      setIsSearching(false);
    }
  };

  // Manejar selección de sugerencia
  const handleSelectSuggestion = async (suggestion: RfcSuggestion) => {
    onChange(suggestion.rfc);
    setShowSuggestions(false);
    
    try {
      const result = await clienteCatalogoService.buscarClientePorRFC(suggestion.rfc);
      if (result.encontrado && result.cliente) {
        onSelect(result.cliente);
      }
    } catch (error) {
      console.error('Error al obtener datos del cliente:', error);
    }
  };

  // Manejar teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            disabled={disabled}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            placeholder="RFC"
            autoComplete="off"
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.rfc}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {suggestion.rfc}
                  </div>
                  {(suggestion.razonSocial || suggestion.nombre) && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {suggestion.razonSocial || suggestion.nombre}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={handleSearch}
          disabled={disabled || isSearching || !value.trim()}
          className="px-3 sm:px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
        >
          <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">{isSearching ? 'Buscando...' : 'Buscar'}</span>
          <span className="sm:hidden">{isSearching ? '...' : 'Buscar'}</span>
        </button>
      </div>
    </div>
  );
};

