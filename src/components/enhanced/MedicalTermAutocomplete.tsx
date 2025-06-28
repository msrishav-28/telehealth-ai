'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { Search, Stethoscope } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';

// Medical terms database (in production, this would come from an API)
const MEDICAL_TERMS = [
  // Symptoms
  'headache', 'fever', 'cough', 'fatigue', 'nausea', 'dizziness', 'chest pain',
  'shortness of breath', 'abdominal pain', 'back pain', 'joint pain', 'muscle pain',
  'sore throat', 'runny nose', 'congestion', 'rash', 'itching', 'swelling',
  
  // Conditions
  'diabetes', 'hypertension', 'asthma', 'allergies', 'depression', 'anxiety',
  'arthritis', 'migraine', 'insomnia', 'acid reflux', 'bronchitis', 'pneumonia',
  'sinusitis', 'eczema', 'psoriasis', 'anemia', 'thyroid disorder',
  
  // Medications
  'ibuprofen', 'acetaminophen', 'aspirin', 'metformin', 'lisinopril', 'amlodipine',
  'atorvastatin', 'omeprazole', 'albuterol', 'prednisone', 'amoxicillin',
  'azithromycin', 'ciprofloxacin', 'lorazepam', 'sertraline', 'fluoxetine',
  
  // Body parts
  'heart', 'lungs', 'liver', 'kidney', 'brain', 'stomach', 'intestines',
  'spine', 'joints', 'muscles', 'skin', 'eyes', 'ears', 'throat', 'nose',
];

interface MedicalTermAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MedicalTermAutocomplete({
  value,
  onChange,
  placeholder = "Type medical terms...",
  className,
}: MedicalTermAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue] = useDebounce(inputValue, 300);

  // Extract potential medical terms from input
  const extractedTerms = useMemo(() => {
    const words = debouncedValue.toLowerCase().split(/\s+/);
    const matches = words
      .map(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        return MEDICAL_TERMS.find(term => 
          term.includes(cleanWord) || cleanWord.includes(term)
        );
      })
      .filter(Boolean);
    
    return Array.from(new Set(matches));
  }, [debouncedValue]);

  // Get suggestions based on current input
  const suggestions = useMemo(() => {
    if (!debouncedValue || debouncedValue.length < 2) return [];
    
    const query = debouncedValue.toLowerCase();
    const lastWord = query.split(/\s+/).pop() || '';
    
    return MEDICAL_TERMS
      .filter(term => 
        term.toLowerCase().includes(lastWord) && 
        !extractedTerms.includes(term)
      )
      .slice(0, 8)
      .map(term => ({
        value: term,
        label: term.charAt(0).toUpperCase() + term.slice(1),
      }));
  }, [debouncedValue, extractedTerms]);

  const handleInputChange = useCallback((newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  }, [onChange]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    const words = inputValue.split(/\s+/);
    words[words.length - 1] = suggestion;
    const newValue = words.join(' ') + ' ';
    
    setInputValue(newValue);
    onChange(newValue);
  }, [inputValue, onChange]);

  return (
    <div className={className}>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.value}
                onClick={() => handleSuggestionSelect(suggestion.value)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none flex items-center gap-2"
              >
                <Stethoscope className="h-3 w-3 text-muted-foreground" />
                {suggestion.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detected medical terms */}
      {extractedTerms.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground mr-2">Detected terms:</span>
          {extractedTerms.map((term) => (
            <Badge key={term} variant="secondary" className="text-xs">
              {term}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}