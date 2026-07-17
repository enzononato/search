export default function ObrigadoPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-10 min-h-screen">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100/80 relative overflow-hidden transition-all duration-300">
        
        {/* Subtle top brand decoration bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

        {/* Animated Checkmark SVG Container */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-inner animate-pulse-slow">
            <svg
              className="h-10 w-10 text-green-500 transition-all duration-500 scale-100"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success message */}
        <h1 className="mb-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Pesquisa Concluída!
        </h1>
        <h2 className="mb-4 text-xs font-semibold tracking-widest text-blue-600 uppercase">
          Muito obrigado pela participação
        </h2>
        
        <p className="text-sm leading-relaxed text-slate-500 mb-6">
          Sua resposta foi registrada de forma <span className="font-semibold text-slate-700">100% anônima</span> e 
          será fundamental para nos ajudar a aprimorar constantemente os serviços de TI na Revalle.
        </p>

        {/* Action Button */}
        <a
          href="/"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 px-6 py-3.5 text-sm font-bold text-slate-700 transition-all duration-200 active:scale-95 shadow-sm"
        >
          Voltar ao Início
        </a>
      </div>
    </main>
  );
}
