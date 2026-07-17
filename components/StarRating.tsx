"use client";

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
  const estrelas = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div role="radiogroup" aria-label="Avaliação por estrelas" className="flex gap-2">
      {estrelas.map((estrela) => {
        const preenchida = value !== null && estrela <= value;
        return (
          <button
            key={estrela}
            type="button"
            role="radio"
            aria-checked={value === estrela}
            aria-label={`${estrela} de ${max} estrelas`}
            disabled={disabled}
            onClick={() => onChange(estrela)}
            className={`text-4xl transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 ${
              preenchida ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
