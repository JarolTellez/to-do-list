import React, { useState, useEffect, useRef } from 'react';
import { loadTags } from '../../services/tags';

const TagInput = ({ selectedTags, onTagsChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const loadAvailableTags = async () => {
      try {
        const response = await loadTags();
        setAvailableTags(response.data);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };
    loadAvailableTags();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim()) {
        const filtered = availableTags.filter(tag => 
          tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !isTagAlreadySelected(tag.name)
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [inputValue, selectedTags, availableTags]);

  const normalizeTagName = (tagName) => {
    if (!tagName || tagName.length === 0) return tagName;
    return tagName.charAt(0).toUpperCase() + tagName.slice(1).toLowerCase();
  };

  const isTagAlreadySelected = (tagName) => {
    const normalizedInput = normalizeTagName(tagName);
    return selectedTags.some(tag => 
      normalizeTagName(tag.name) === normalizedInput
    );
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setErrorMessage('');
  };

  const handleKeyDown = (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && inputValue.trim()) {
      e.preventDefault();
      
      const normalizedTagName = normalizeTagName(inputValue.trim());
      
      if (isTagAlreadySelected(normalizedTagName)) {
        setErrorMessage(`La etiqueta "${normalizedTagName}" ya está agregada`);
        return;
      }

      addTag({ 
        id: Date.now(), 
        name: normalizedTagName 
      });
      setInputValue('');
    }
  };

  const addTag = (tag) => {
    const normalizedTag = {
      ...tag,
      name: normalizeTagName(tag.name)
    };

    if (!isTagAlreadySelected(normalizedTag.name)) {
      onTagsChange([...selectedTags, normalizedTag]);
      setErrorMessage('');
    } else {
      setErrorMessage(`La etiqueta "${normalizedTag.name}" ya está agregada`);
    }
    
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagId) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
    setErrorMessage('');
  };

  const selectSuggestion = (tag) => {
    if (isTagAlreadySelected(tag.name)) {
      setErrorMessage(`La etiqueta "${tag.name}" ya está agregada`);
      return;
    }
    
    addTag(tag);
  };

  const handleInputBlur = (e) => {
    if (suggestionsRef.current && suggestionsRef.current.contains(e.relatedTarget)) {
      return; 
    }
    

    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  return (
    <div id="tag-input-container">
      {errorMessage && (
        <div className="tag-error-message">
          {errorMessage}
        </div>
      )}

      <ul id="tags-list" className="tags-list">
        {selectedTags.map(tag => (
          <li key={tag.id}>
            {tag.name}
            <button 
              type="button"
              className="remove-tag-btn"
              onClick={() => removeTag(tag.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      
      <input 
        ref={inputRef}
        type="text" 
        id="tag-input" 
        placeholder="Escribe para buscar o agregar etiquetas (presiona Espacio o Enter)"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleInputBlur}
        onFocus={() => {
          if (inputValue.trim() && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <ul 
          ref={suggestionsRef}
          id="suggestions" 
          className="dropdown active"
        >
          {suggestions.map(tag => (
            <li 
              key={tag.id} 
              onClick={() => selectSuggestion(tag)}
              className="suggestion-item"
              tabIndex={0} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  selectSuggestion(tag);
                }
              }}
            >
              <span>{tag.name}</span>
              {tag.description && (
                <span className="suggestion-description">
                  {tag.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagInput;