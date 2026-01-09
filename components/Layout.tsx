
import React from 'react';

export const MunicipalityLogo: React.FC<{ className?: string }> = ({ className = "w-32 h-32" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <img 
      src="logo.png" 
      alt="Logotipo Transporte Escolar - Soure" 
      className="w-full h-full object-contain filter drop-shadow-2xl"
      onError={(e) => {
        // Fallback visual caso a imagem não seja encontrada
        e.currentTarget.style.display = 'none';
        console.warn("Ficheiro logo.png não encontrado na raiz.");
      }}
    />
  </div>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Calendário', icon: '📅' },
    { id: 'requests', label: 'Pedidos', icon: '📝' },
    { id: 'shifts', label: 'Turnos', icon: '🔄' },
    { id: 'weekly-schedule', label: 'Escalas', icon: '🗓️' },
    { id: 'entities', label: 'Entidades', icon: '🏢' },
    { id: 'drivers', label: 'Motoristas', icon: '👤' },
    { id: 'buses', label: 'Autocarros', icon: '🚌' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible">
      {/* Sidebar - Fundo Negro e Letras Amarelas (#facc15) */}
      <aside className="w-64 bg-[#0a0a0b] text-[#facc15] flex flex-col shadow-2xl border-r border-white/5 print:hidden z-20">
        <div className="p-8 border-b border-white/10 flex flex-col items-center">
          {/* Imagem do Autocarro posicionada por cima do texto */}
          <MunicipalityLogo className="w-52 h-52 mb-2 transition-transform hover:scale-105 duration-500" />
          
          <div className="text-center w-full">
            <div className="h-[1px] w-12 bg-[#facc15]/30 mx-auto mb-4"></div>
            <p className="text-[11px] text-[#facc15] font-black uppercase tracking-[0.5em] leading-tight">
              Município de Soure
            </p>
          </div>
        </div>
        
        <nav className="flex-1 mt-8 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-5 py-4 text-[10px] font-black rounded-2xl transition-all duration-300 uppercase tracking-[0.2em] ${
                activeTab === item.id 
                  ? 'bg-[#facc15] text-black shadow-[0_10px_30px_rgba(250,204,21,0.2)] scale-[1.03]' 
                  : 'text-[#facc15]/50 hover:bg-white/5 hover:text-[#facc15]'
              }`}
            >
              <span className={`mr-4 text-xl ${activeTab === item.id ? 'opacity-100' : 'opacity-40'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-8 bg-black/40 text-[7px] text-[#facc15]/20 text-center font-black tracking-[0.2em] border-t border-white/5 uppercase leading-relaxed">
          Subunidade org. de Manutenção de Instalações,<br/>Equipamentos e Transporte
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 print:p-0 print:overflow-visible relative">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
