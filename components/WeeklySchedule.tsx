
import React, { useState, useMemo, useRef } from 'react';
import { AppData, BusRequest, RequestStatus, Shift } from '../types';
import { getShiftForDriver } from './ShiftManager';
import { MunicipalityLogo } from './Layout';

type ScheduleMode = 'general' | 'driver';

const OfficialHeaderLogo = () => (
  <div className="flex items-center gap-6 border-r-[4px] border-[#facc15] pr-8 mr-8">
    <MunicipalityLogo className="w-24 h-24" />
    <div className="flex flex-col">
      <h2 className="text-3xl font-black uppercase tracking-[-0.08em] leading-none text-slate-900 italic">Soure</h2>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#facc15] mt-2 border-t border-slate-100 pt-2">Município de Soure</p>
    </div>
  </div>
);

const WeeklySchedule: React.FC<{ data: AppData }> = ({ data }) => {
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('general');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(new Date(date.setDate(diff)).setHours(0,0,0,0));
  };

  const [startDate, setStartDate] = useState<string>(() => getMonday(new Date()).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = getMonday(new Date());
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  });

  const allDatesInRange = useMemo(() => {
    const dates = [];
    let curr = new Date(startDate);
    const end = new Date(endDate);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }, [startDate, endDate]);

  const groupedRequests = useMemo(() => {
    let filtered = data.requests.filter(req => req.departureDate >= startDate && req.departureDate <= endDate && req.status !== RequestStatus.CANCELLED);
    if (scheduleMode === 'driver' && selectedDriverId) {
      filtered = filtered.filter(req => req.assignments.some(a => a.driverId === selectedDriverId));
    }
    const groups: Record<string, BusRequest[]> = {};
    filtered.forEach(req => {
      if (!groups[req.departureDate]) groups[req.departureDate] = [];
      groups[req.departureDate].push(req);
    });
    return groups;
  }, [data.requests, startDate, endDate, scheduleMode, selectedDriverId]);

  const handlePrint = () => window.print();
  const handleExportPDF = async () => {
    if (!scheduleRef.current) return;
    setIsExporting(true);
    const opt = {
      margin: 8,
      filename: `Plano_Transportes_Soure_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      // @ts-ignore
      await html2pdf().set(opt).from(scheduleRef.current).save();
    } finally { setIsExporting(false); }
  };

  const selectedDriver = data.drivers.find(d => d.id === selectedDriverId);
  const driverShift = selectedDriver ? getShiftForDriver(selectedDriver, data) : null;

  return (
    <div className="space-y-10">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] print:hidden">
        <div className="flex flex-col xl:flex-row justify-between items-end gap-10">
          <div className="space-y-6 flex-1 w-full">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-5 italic leading-none">
              <span className="w-16 h-16 bg-[#0a0a0b] text-[#facc15] rounded-3xl flex items-center justify-center text-3xl shadow-2xl">🗓️</span>
              Escalas Oficiais
            </h2>
            <div className="flex flex-wrap gap-10 items-center">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Período de Serviço</label>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none px-4 py-2 text-sm font-black outline-none focus:ring-0" />
                  <span className="text-slate-300 font-black">/</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none px-4 py-2 text-sm font-black outline-none focus:ring-0" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Tipo de Relatório</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  <button onClick={() => setScheduleMode('general')} className={`px-8 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${scheduleMode === 'general' ? 'bg-[#facc15] text-black shadow-xl' : 'text-slate-500'}`}>Plano Geral</button>
                  <button onClick={() => setScheduleMode('driver')} className={`px-8 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${scheduleMode === 'driver' ? 'bg-[#facc15] text-black shadow-xl' : 'text-slate-500'}`}>Por Colaborador</button>
                </div>
              </div>
              {scheduleMode === 'driver' && (
                <div className="space-y-3 flex-1 min-w-[300px]">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Colaborador Seleccionado</label>
                  <select value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black outline-none appearance-none focus:ring-2 focus:ring-[#facc15]">
                    <option value="">Escolher Motorista...</option>
                    {data.drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4 w-full xl:w-auto">
            <button onClick={handleExportPDF} disabled={isExporting} className="flex-1 xl:flex-none bg-[#0a0a0b] text-white px-10 py-5 rounded-2xl font-black text-xs hover:bg-black transition shadow-2xl flex items-center justify-center gap-4 uppercase tracking-[0.2em]">
              {isExporting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : "GERAR PDF"}
            </button>
            <button onClick={handlePrint} className="flex-1 xl:flex-none bg-[#facc15] text-black px-10 py-5 rounded-2xl font-black text-xs hover:bg-[#eab308] transition shadow-2xl flex items-center justify-center gap-4 uppercase tracking-[0.2em]">
              IMPRIMIR
            </button>
          </div>
        </div>
      </div>

      <div ref={scheduleRef} className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Cabeçalho Reduzido em 50% */}
        <div className="p-8 border-b-[8px] border-[#facc15] bg-[#fcfcfd] print:bg-white">
          <div className="flex justify-between items-center">
            <OfficialHeaderLogo />
            <div className="text-right">
              <h1 className="text-2xl font-black text-slate-900 tracking-[-0.04em] uppercase leading-none italic">
                {scheduleMode === 'driver' && selectedDriver ? `Agenda Individual: ${selectedDriver.name}` : 'Plano Operacional Semanal'}
              </h1>
              <p className="text-[9px] font-black text-slate-400 mt-3 uppercase tracking-[0.15em] border-t border-slate-100 pt-3 text-right">Município de Soure • Subunidade org. de Manutenção de Instalações, Equipamentos e Transporte</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-12">
          {(scheduleMode === 'driver' && !selectedDriverId) ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-200">
              <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs italic">Selecione um colaborador no painel de controlo para visualizar a agenda.</p>
            </div>
          ) : (
            allDatesInRange.map(date => {
              const requests = groupedRequests[date] || [];
              const d = new Date(date);
              const isWeekday = d.getDay() >= 1 && d.getDay() <= 5;
              if (requests.length === 0 && !(scheduleMode === 'driver' && isWeekday)) return null;

              return (
                <div key={date} className="space-y-6 break-inside-avoid">
                  <div className="flex items-center gap-6 border-b-2 border-slate-900/5 pb-4">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">{d.toLocaleDateString('pt-PT', { weekday: 'long' })}</h3>
                    <span className="text-[10px] font-black text-[#facc15] tracking-[0.3em] uppercase border-l-2 border-[#facc15] pl-4 ml-auto">{d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {scheduleMode === 'driver' && isWeekday && driverShift && (
                      <div className="p-6 rounded-[2rem] bg-gradient-to-r from-amber-50/50 to-white border-l-[8px] border-[#facc15] flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#facc15] shadow-md border border-slate-100">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-[#facc15] uppercase tracking-[0.2em] mb-1">Período Base ({driverShift.name})</p>
                            <p className="text-lg font-black text-slate-800 uppercase tracking-tighter italic leading-tight">{driverShift.hours}</p>
                          </div>
                        </div>
                        <div className="bg-black text-[#facc15] px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">Disponibilidade</div>
                      </div>
                    )}

                    {requests.length === 0 && scheduleMode === 'driver' && (
                      <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Sem serviços externos agendados</p>
                      </div>
                    )}

                    {requests.map(req => (
                      <div key={req.id} className="p-8 rounded-[2rem] border-2 border-slate-50 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] group hover:border-[#facc15]/30 transition-all duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                          <div className="md:col-span-3 border-r border-slate-50 pr-6">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Horário</p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl"><span className="text-[8px] font-black text-slate-400 uppercase">Partida</span><span className="text-lg font-black text-slate-900 italic">{req.departureTime}</span></div>
                              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl"><span className="text-[8px] font-black text-slate-400 uppercase">Retorno</span><span className="text-lg font-black text-slate-900 italic">{req.returnTime}</span></div>
                            </div>
                          </div>
                          <div className="md:col-span-5 border-r border-slate-50 pr-6">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Serviço & Requerente</p>
                            <p className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight italic mb-4 group-hover:text-[#facc15] transition-colors">{req.destination}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 inline-block px-3 py-1.5 rounded-lg">{req.requesterName}</p>
                          </div>
                          <div className="md:col-span-4">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Recursos Mobilizados</p>
                            <div className="space-y-3">
                              {req.assignments.map((asgn, i) => {
                                const dr = data.drivers.find(d => d.id === asgn.driverId);
                                const bu = data.buses.find(b => b.id === asgn.busId);
                                const isCurrent = asgn.driverId === selectedDriverId;
                                return (
                                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-300 ${isCurrent ? 'bg-black text-[#facc15] border-black shadow-lg scale-[1.02]' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-black uppercase tracking-tight italic">{bu?.plate}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] font-black uppercase italic opacity-80">{dr?.name.split(' ')[0]} {dr?.name.split(' ').pop()}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="p-10 border-t-2 border-slate-50 bg-[#fcfcfd] flex justify-between items-center print:bg-white">
          <div className="flex items-center gap-6">
             <div className="w-10 h-1 bg-[#facc15] rounded-full shadow-md"></div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Serviço de Transportes • Município de Soure</p>
          </div>
          <div className="text-right">
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Emitido em {new Date().toLocaleDateString('pt-PT')} • {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
