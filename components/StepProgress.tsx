interface StepProgressProps {
  atual: number;
  total: number;
}

export default function StepProgress({ atual, total }: StepProgressProps) {
  const percentual = Math.round((atual / total) * 100);
  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-sm text-gray-500">
        <span>
          Pergunta {atual} de {total}
        </span>
        <span>{percentual}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}
