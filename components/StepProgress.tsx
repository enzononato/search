interface StepProgressProps {
  atual: number;
  total: number;
}

export default function StepProgress({ atual, total }: StepProgressProps) {
  const percentual = Math.round((atual / total) * 100);
  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
            Progresso da Pesquisa
          </span>
          <span className="text-sm font-medium text-slate-500">
            Questão <span className="font-semibold text-slate-800">{atual}</span> de <span className="font-semibold text-slate-800">{total}</span>
          </span>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 tabular-nums">
          {percentual}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out shadow-[0_1px_4px_rgba(59,130,246,0.2)]"
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}
