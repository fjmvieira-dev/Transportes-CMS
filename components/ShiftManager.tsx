
import React, { useState } from 'react';
import { AppData, Shift, Driver } from '../types';
import { storageService } from '../services/storageService';
import { MunicipalityLogo } from './Layout';

const getShiftColorClasses = (color: string) => {
  switch (color) {
    case 'orange': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'blue': return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'emerald': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-100';
  }
};

export const getShiftForDriver = (driver: Driver, data: AppData) => {
    return data.shifts.find(s => s.id === driver.currentShiftId) || data.shifts[0];
};

const ShiftManager: React.FC<{ data: AppData; onUpdate: () => void }> = ({ data, onUpdate }) => {
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const handleUpdateDriverShift = (driverId: string, shiftId: string) => {
    const updatedDrivers = data.drivers.map(d => 
      d.id === driverId ? { ...d, currentShiftId: shiftId } : d
    );
    storageService.updateDrivers(updatedDrivers);
    onUpdate();
  };

  const handleSaveShiftDef = () => {
    if (!editingShift) return;
    const updatedShifts = data.shifts.map(s => s.id === editingShift.id ? editingShift : s);
    storageService.updateShifts(updatedShifts);
    setEditingShift(null);
    onUpdate();
  };

  const autoRotate = () => {
    if (!confirm("Confirmar rotação semanal circular da equipa (Turno A -> B, B -> C, C -> A)?\n\nEsta ação deve ser realizada apenas uma vez por semana.")) return;
    
    const shiftIds = data.shifts.map(s => s.id);
    const updatedDrivers = data.drivers.map(d => {
        const currentShiftId = d.currentShiftId || shiftIds[0];
        const currentIdx = shiftIds.indexOf(currentShiftId);
        const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % shiftIds.length;
        return { ...d, currentShiftId: shiftIds[nextIdx] };
    });
    
    storageService.updateDrivers(updatedDrivers);
    onUpdate();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-8">
          <MunicipalityLogo className="w-24 h-24" />
          <div className="border-l-2 border-slate-100 pl-8">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Turnos</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
              Gestão Semanal de Disponibilidade e Vagas
            </p>
          </div>
        </div>
        <button 
          onClick={autoRotate} 
          className="bg-black text-[#facc15] px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-900 transition shadow-2xl shadow-black/10 border border-white/5 flex items-center gap-3"
        >
          <span>🔄</span> RODAR EQUIPA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.shifts.map(shift => {
          const count = data.drivers.filter(d => d.currentShiftId === shift.id).length;
          const isOverCapacity = count > shift.slots;

          return (
            <div key={shift.id} className={`p-8 rounded-[2.5rem] border-2 shadow-sm transition-all group hover:scale-[1.02] ${getShiftColorClasses(shift.color)}`}>
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-black text-lg uppercase tracking-tighter leading-none italic">{shift.name}</h3>
                <button onClick={() => setEditingShift(shift)} className="p-2 bg-white/20 hover:bg-white/40 rounded-xl transition text-slate-900">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2 mb-8">
                <p className="text-[8px] font-black uppercase opacity-50 tracking-widest">Horário:</p>
                <p className="text-sm font-black text-slate-900">{shift.hours}</p>
              </div>
              <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-colors ${isOverCapacity ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white/40 border-white/10'}`}>
                <span className="text-[9px] font-black uppercase tracking-widest">Capacidade:</span>
                <span className="text-sm font-black">{count} / {shift.slots} motoristas</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Atribuição Individual de Turnos</h3>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Selecione o turno correspondente para cada operador</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/30">
                    <tr>
                        <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                        <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Alterar Turno</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.drivers.map(driver => (
                        <tr key={driver.id} className="hover:bg-slate-50/50 transition group">
                            <td className="px-10 py-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-slate-100 group-hover:bg-[#facc15] group-hover:text-black rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs transition-all duration-300">
                                        {driver.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 uppercase italic">{driver.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{driver.phone}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                                <div className="flex justify-end gap-3">
                                    {data.shifts.map(s => (
                                        <button 
                                          key={s.id} 
                                          onClick={() => handleUpdateDriverShift(driver.id, s.id)} 
                                          className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all border-2 flex items-center justify-center ${driver.currentShiftId === s.id ? 'bg-black text-[#facc15] border-black shadow-xl' : 'bg-white text-slate-300 border-slate-50 hover:border-slate-300 hover:text-slate-600'}`}
                                          title={s.name}
                                        >
                                          {s.id.replace('S', '')}
                                        </button>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {editingShift && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Definições do Turno</h3>
                    <button onClick={() => setEditingShift(null)} className="text-slate-300 hover:text-slate-900 text-3xl font-light focus:outline-none">&times;</button>
                </div>
                <div className="p-10 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Identificativo</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-black" value={editingShift.name} onChange={e => setEditingShift({...editingShift, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário de Disponibilidade</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-black" value={editingShift.hours} onChange={e => setEditingShift({...editingShift, hours: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº de Motoristas (Slots Máximos)</label>
                        <div className="flex items-center gap-4">
                            <input 
                              type="number"
                              min="1"
                              max="20"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-black" 
                              value={editingShift.slots} 
                              onChange={e => setEditingShift({...editingShift, slots: Math.max(1, parseInt(e.target.value) || 1)})} 
                            />
                            <div className="w-20 text-[10px] font-black text-slate-400 uppercase">Motoristas</div>
                        </div>
                    </div>
                </div>
                <div className="p-10 bg-slate-50 flex justify-end gap-6 border-t border-slate-100">
                    <button onClick={() => setEditingShift(null)} className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Cancelar</button>
                    <button onClick={handleSaveShiftDef} className="bg-black text-[#facc15] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-slate-900 transition-all">Guardar Alterações</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManager;
