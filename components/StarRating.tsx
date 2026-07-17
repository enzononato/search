"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
}

export default function StarRating({
  value,
  onChange,
  max = 5,
  disabled = false,
}: StarRatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const estrelas = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div
      role="radiogroup"
      aria-label="Avaliação por estrelas"
      className="flex items-center gap-1.5 py-1"
    >
      {estrelas.map((estrela) => {
        // Star is active if hovered (on desktop) or if its value is <= selected value
        const isFilled = hoveredValue !== null 
          ? estrela <= hoveredValue 
          : value !== null && estrela <= value;
        
        const isSelected = value === estrela;

        return (
          <button
            key={estrela}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${estrela} de ${max} estrelas`}
            disabled={disabled}
            onClick={() => onChange(estrela)}
            onMouseEnter={() => !disabled && setHoveredValue(estrela)}
            onMouseLeave={() => !disabled && setHoveredValue(null)}
            className={`group relative p-1 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {/* Pulsing ring indicator on focus */}
            <span className="absolute inset-0 rounded-full scale-75 border-2 border-blue-500/0 opacity-0 transition-all group-focus-visible:scale-110 group-focus-visible:border-blue-500/60 group-focus-visible:opacity-100" />
            
            <svg
              className={`h-9 w-9 transition-all duration-300 ease-out ${
                isFilled 
                  ? "scale-105 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]" 
                  : "text-slate-200 hover:text-slate-300"
              } ${!disabled && "group-hover:scale-115 group-active:scale-95"}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isFilled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={isFilled ? "0.5" : "1.5"}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
      
      {/* Display simple textual indicator for premium feel */}
      {value !== null && (
        <span className="ml-3 text-sm font-semibold text-slate-500 transition-all animate-fade-in animate-duration-300">
          ({value} de {max})
        </span>
      )}
    </div>
  );
}
