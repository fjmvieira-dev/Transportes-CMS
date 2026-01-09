
import React, { useState, useEffect } from 'react';
import { AppData, RequestStatus, BusRequest } from '../types';
import { geminiService } from '../services/geminiService';
import CalendarView from './CalendarView';
import RequestManager from './RequestManager';

const Dashboard: React.FC<{ data: AppData; onUpdate: () => void }> = ({ data, onUpdate }) => {
  const [insight, setInsight] = useState<string>('Consultando inteligência municipal...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingRequest, setEditingRequest] = useState<BusRequest | null>(null);

  const pendingRequests = data.requests.filter(r => !r.assignments || r.assignments.length === 0);
  const totalBuses = data.buses.length;
  const totalDrivers = data.drivers.length;

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const text = await geminiService.analyzeSchedule(data);
    setInsight(text || "Sem análise operacional disponível.");
    setIsAnalyzing(false);
  };

  useEffect(() => { runAnalysis(); }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-[-0.06em] uppercase italic leading-none">Município de Soure</h2>
          <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] mt-3 flex items-center gap-3">
            <span className="w-10 h-[2px] bg-[#facc15]"></span>
            Subunidade org. de Manutenção de Instalações, Equipamentos e Transporte
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Ativos</span>
          </div>
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <span className="w-3 h-3 bg-[#facc15] rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Pendentes</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8">
          <div className="bg-white rounded-[3rem] p-4 shadow-[0_30px_60px_rgba(0,0,0,0.03)] border border-slate-100">
            <CalendarView data={data} onEventClick={setEditingRequest} />
          </div>
        </div>

        <div className="xl:col-span-4 space-y-10">
          <div className="bg-[#0a0a0b] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#facc15]/10 rounded-bl-full transition-transform duration-700 group-hover:scale-150"></div>
            <p className="text-[10px] font-black text-[#facc15] uppercase tracking-[0.3em] mb-4">Requisições Críticas</p>
            <div className="flex items-end justify-between">
              <h3 className={`text-7xl font-black tracking-tighter italic ${pendingRequests.length > 0 ? 'text-[#facc15]' : 'text-emerald-500'}`}>
                {pendingRequests.length}
              </h3>
              <div className="text-right">
                <span className="text-white/40 text-[10px] font-black uppercase tracking-tighter leading-tight block mb-2">Serviços em<br/>processamento</span>
                <span className="text-[10px] bg-white/10 text-white px-3 py-1 rounded-lg font-black italic">Operacional</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center text-slate-900 italic">
                <span className="mr-3 text-xl">✨</span> Análise IA
              </h4>
              <button 
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="text-[9px] bg-slate-100 hover:bg-slate-900 hover:text-white px-4 py-2 rounded-xl font-black transition-all border border-slate-100 uppercase tracking-widest"
              >
                {isAnalyzing ? '...' : 'Recarregar'}
              </button>
            </div>
            <div className="text-xs leading-relaxed text-slate-600 font-medium bg-slate-50/50 p-6 rounded-3xl border border-slate-100 italic relative z-10">
              {insight}
            </div>
          </div>

          <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-10">
            <h4 className="text-[11px] font-black text-slate-400 mb-8 uppercase tracking-[0.4em] italic">Capacidade de Frota</h4>
            <div className="space-y-6">
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 group-hover:bg-[#facc15]/10 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#facc15] transition-all duration-500 text-2xl">🚌</div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Viaturas</span>
                </div>
                <span className="font-black text-2xl text-slate-900 italic">{totalBuses}</span>
              </div>
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 group-hover:bg-[#facc15]/10 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#facc15] transition-all duration-500 text-2xl">👮</div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Operacionais</span>
                </div>
                <span className="font-black text-2xl text-slate-900 italic">{totalDrivers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingRequest && (
        <RequestManager 
          data={data} 
          onUpdate={() => { onUpdate(); setEditingRequest(null); }} 
          externalEditRequest={editingRequest}
          onCloseEdit={() => setEditingRequest(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
