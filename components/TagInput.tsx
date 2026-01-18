import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { getAllTags } from '../services/mockDb';

interface TagInputProps {
    selectedTags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ selectedTags, onChange, placeholder = "Add tags..." }) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load suggestions from DB, excluding already selected
        const all = getAllTags().map(t => t.name);
        setSuggestions(all.filter(t => !selectedTags.includes(t)));
    }, [selectedTags]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
            removeTag(selectedTags[selectedTags.length - 1]);
        }
    };

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !selectedTags.includes(trimmed)) {
            onChange([...selectedTags, trimmed]);
            setInputValue('');
            setShowSuggestions(false);
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(selectedTags.filter(tag => tag !== tagToRemove));
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredSuggestions = suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase()));

    return (
        <div className="relative" ref={wrapperRef}>
            <div 
                className="flex flex-wrap gap-2 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all min-h-[42px]"
                onClick={() => inputRef.current?.focus()}
            >
                {selectedTags.map(tag => (
                    <span key={tag} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1 border border-blue-100 dark:border-blue-800">
                        {tag}
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeTag(tag); }} 
                            className="hover:text-blue-900 dark:hover:text-blue-100 focus:outline-none"
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 outline-none text-sm min-w-[80px] bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder={selectedTags.length === 0 ? placeholder : ""}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                />
            </div>

            {showSuggestions && (inputValue || filteredSuggestions.length > 0) && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {inputValue && !filteredSuggestions.includes(inputValue) && (
                        <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            onClick={() => addTag(inputValue)}
                        >
                            <Plus size={14} /> Create "{inputValue}"
                        </button>
                    )}
                    {filteredSuggestions.map(suggestion => (
                        <button
                            key={suggestion}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            onClick={() => addTag(suggestion)}
                        >
                            <Tag size={14} className="text-slate-400 dark:text-slate-500" /> {suggestion}
                        </button>
                    ))}
                    {filteredSuggestions.length === 0 && !inputValue && (
                        <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">Type to create a tag...</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TagInput;