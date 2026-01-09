
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, BusRequest, RequestStatus, Driver, Bus, Entity, Assignment } from '../types';
import { storageService } from '../services/storageService';
import * as XLSX from 'xlsx';

interface RequestManagerProps {
  data: AppData;
  onUpdate: () => void;
  externalEditRequest?: BusRequest | null;
  onCloseEdit?: () => void;
}

type ViewMode = 'day' | 'week' | 'month' | 'range';

const getStartOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const formatDateISO = (d: Date) => d.toISOString().split('T')[0];

const checkTimeOverlap = (s1: string, e1: string, s2: string, e2: string) => {
  if (!s1 || !e1 || !s2 || !e2) return false;
  return s1 < e2 && e1 > s2;
};

export const calculateTotalCapacity = (assignments: Assignment[], buses: Bus[]) => {
  return assignments.reduce((total, asgn) => {
    const bus = buses.find(b => b.id === asgn.busId);
    return total + (bus?.capacity || 0);
  }, 0);
};

const RequestManager: React.FC<RequestManagerProps> = ({ data, onUpdate, externalEditRequest, onCloseEdit }) => {
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [startDate, setStartDate] = useState(formatDateISO(new Date()));
  const [endDate, setEndDate] = useState(formatDateISO(new Date()));
  const [showCompleted, setShowCompleted] = useState(false);
  
  const [isQuickAddingEntity, setIsQuickAddingEntity] = useState(false);
  const [quickEntityName, setQuickEntityName] = useState('');

  // Estados para Recorrência
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]); // 0-6 (Dom-Sab)

  const [formData, setFormData] = useState<Partial<BusRequest>>({
    status: RequestStatus.PENDING,
    departureDate: formatDateISO(new Date()),
    passengerCount: 1,
    requesterName: '',
    notes: '',
    assignments: []
  });

  useEffect(() => {
    if (externalEditRequest) {
      setFormData({
        ...externalEditRequest,
        assignments: externalEditRequest.assignments || []
      });
      setIsRecurrent(false); // Desativar recorrência na edição de um item específico
      setShowModal(true);
    }
  }, [externalEditRequest]);

  const navigate = (direction: number) => {
    const newDate = new Date(referenceDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + direction);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + direction);
    setReferenceDate(newDate);
  };

  const generateExcel = (requestsToExport: BusRequest[], filename: string) => {
    const wb = XLSX.utils.book_new();
    const monthGroups: Record<string, any[]> = {};
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    requestsToExport.forEach(req => {
      const d = new Date(req.departureDate);
      const sheetName = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthGroups[sheetName]) monthGroups[sheetName] = [];
      
      const resourcesText = req.assignments.map(asgn => {
        const dr = data.drivers.find(d => d.id === asgn.driverId);
        const bu = data.buses.find(b => b.id === asgn.busId);
        return `${bu?.plate || 'S/V'} (${dr?.name || 'S/M'})`;
      }).join('; ');

      monthGroups[sheetName].push({
        'Data': req.departureDate,
        'Saída': req.departureTime,
        'Retorno': req.returnTime,
        'Entidade': req.requesterName,
        'Destino': req.destination,
        'Pax': req.passengerCount,
        'Recursos': resourcesText,
        'Observações': req.notes || '',
        'Estado': req.status
      });
    });

    const sortedKeys = Object.keys(monthGroups).sort((a, b) => {
        const [mA, yA] = a.split(' ');
        const [mB, yB] = b.split(' ');
        if (yA !== yB) return parseInt(yA) - parseInt(yB);
        return months.indexOf(mA) - months.indexOf(mB);
    });

    if (sortedKeys.length === 0) {
        alert("Não existem dados para exportar.");
        return;
    }

    sortedKeys.forEach(sheetName => {
      const ws = XLSX.utils.json_to_sheet(monthGroups[sheetName]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    });

    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleExportExcel = () => {
    generateExcel(filteredRequests, `Pedidos_Soure_Seleccao_${startDate}_${endDate}`);
  };

  const handleExportAnnualExcel = () => {
    const currentYear = new Date().getFullYear().toString();
    const annualRequests = data.requests.filter(r => r.departureDate.startsWith(currentYear));
    generateExcel(annualRequests, `Pedidos_Soure_Anual_${currentYear}`);
  };

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    let finalRequester = formData.requesterName;

    if (isQuickAddingEntity && quickEntityName.trim()) {
      const newEntity: Entity = {
        id: Math.random().toString(36).substr(2, 9),
        name: quickEntityName.trim(),
        address: '',
        phone: '',
        contactPersons: []
      };
      const updatedEntities = [...data.entities, newEntity];
      storageService.updateEntities(updatedEntities);
      finalRequester = newEntity.name;
    }

    if (!finalRequester || !formData.destination) {
        alert("Preencha a entidade e o destino.");
        return;
    }

    const finalAssignments = (formData.assignments || []).filter(a => a.driverId && a.busId);
    
    // Validar duplicados na mesma atribuição
    const driverIds = finalAssignments.map(a => a.driverId);
    const busIds = finalAssignments.map(a => a.busId);
    if (new Set(driverIds).size !== driverIds.length || new Set(busIds).size !== busIds.length) {
        alert("Erro: Não pode atribuir o mesmo motorista ou autocarro mais do que uma vez ao mesmo serviço.");
        return;
    }

    const hasAssignments = finalAssignments.length > 0;
    const finalStatus = hasAssignments ? (formData.status === RequestStatus.COMPLETED ? RequestStatus.COMPLETED : RequestStatus.ASSIGNED) : RequestStatus.PENDING;

    const baseData = { 
        ...formData, 
        requesterName: finalRequester, 
        assignments: finalAssignments, 
        status: finalStatus 
    };

    if (formData.id) {
        // Modo Edição (Apenas um item)
        const updated = data.requests.map(r => r.id === formData.id ? { ...r, ...baseData } as BusRequest : r);
        storageService.updateRequests(updated);
    } else {
        // Modo Novo Pedido (Normal ou Recorrente)
        if (isRecurrent) {
            if (!recurrenceEndDate || selectedWeekdays.length === 0) {
                alert("Para pedidos recorrentes, escolha os dias da semana e a data limite.");
                return;
            }

            const newRequests: BusRequest[] = [];
            let current = new Date(formData.departureDate!);
            const limit = new Date(recurrenceEndDate);

            while (current <= limit) {
                if (selectedWeekdays.includes(current.getDay())) {
                    const dateStr = formatDateISO(current);
                    
                    // Nota: Aqui poderíamos validar conflitos para cada data, 
                    // mas como cada pedido é independente, permitimos criar e o calendário sinalizará o conflito visualmente.
                    newRequests.push({
                        ...(baseData as BusRequest),
                        id: Math.random().toString(36).substr(2, 9),
                        departureDate: dateStr
                    });
                }
                current.setDate(current.getDate() + 1);
            }

            if (newRequests.length === 0) {
                alert("Nenhuma ocorrência encontrada no intervalo e dias selecionados.");
                return;
            }

            storageService.updateRequests([...data.requests, ...newRequests]);
            alert(`${newRequests.length} pedidos recorrentes criados com sucesso.`);
        } else {
            const newReq: BusRequest = { ...(baseData as BusRequest), id: Math.random().toString(36).substr(2, 9) };
            storageService.updateRequests([...data.requests, newReq]);
        }
    }

    // Reset de estados
    setIsQuickAddingEntity(false);
    setQuickEntityName('');
    setIsRecurrent(false);
    setSelectedWeekdays([]);
    setRecurrenceEndDate('');
    setShowModal(false);
    onCloseEdit?.();
    onUpdate();
  };

  const openEditModal = (req: BusRequest) => {
    setFormData({ ...req });
    setShowModal(true);
  };

  const handleStatusChange = (id: string, status: RequestStatus) => {
    const updated = data.requests.map(r => r.id === id ? { ...r, status } : r);
    storageService.updateRequests(updated);
    onUpdate();
  };

  const currentModalCapacity = useMemo(() => {
    return calculateTotalCapacity(formData.assignments || [], data.buses);
  }, [formData.assignments, data.buses]);

  const isCapacityCritical = (formData.passengerCount || 0) > currentModalCapacity && (formData.assignments?.length || 0) > 0;

  const filteredRequests = useMemo(() => {
    return data.requests.filter(req => {
        if (!showCompleted && (req.status === RequestStatus.COMPLETED || req.status === RequestStatus.CANCELLED)) return false;
        if (showCompleted && req.status !== RequestStatus.COMPLETED) return false;

        const reqDate = new Date(req.departureDate);
        if (viewMode === 'day') return formatDateISO(reqDate) === formatDateISO(referenceDate);
        if (viewMode === 'week') {
            const start = getStartOfWeek(referenceDate);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return reqDate >= start && reqDate <= end;
        }
        if (viewMode === 'month') return reqDate.getMonth() === referenceDate.getMonth() && reqDate.getFullYear() === referenceDate.getFullYear();
        if (viewMode === 'range') return req.departureDate >= startDate && req.departureDate <= endDate;
        
        return true;
    }).sort((a, b) => a.departureDate.localeCompare(b.departureDate) || a.departureTime.localeCompare(b.departureTime));
  }, [data.requests, viewMode, referenceDate, startDate, endDate, showCompleted]);

  const groupedRequests = useMemo(() => {
    const groups: Record<string, BusRequest[]> = {};
    filteredRequests.forEach(req => {
      if (!groups[req.departureDate]) groups[req.departureDate] = [];
      groups[req.departureDate].push(req);
    });
    return groups;
  }, [filteredRequests]);

  const sortedDates = Object.keys(groupedRequests).sort();

  const checkResourceAvailability = (type: 'driver' | 'bus', id: string, reqDate: string, depTime: string, retTime: string, reqId?: string, currentIdx?: number, assignmentsList: Assignment[] = []) => {
    if (!id) return true;
    const isAlreadyChosen = assignmentsList.some((a, idx) => {
        if (idx === currentIdx) return false;
        return type === 'driver' ? a.driverId === id : a.busId === id;
    });
    if (isAlreadyChosen) return false;
    
    if (type === 'driver' && reqDate) {
        const isUnavailable = data.unavailabilities.some(u => {
            if (u.driverId !== id) return false;
            const start = u.startDate.split('T')[0];
            const end = u.endDate.split('T')[0];
            return reqDate >= start && reqDate <= end;
        });
        if (isUnavailable) return false;
    }
    
    if (reqDate && depTime && retTime) {
        const hasConflict = data.requests.some(otherReq => {
            if (otherReq.id === reqId || otherReq.status === RequestStatus.COMPLETED || otherReq.status === RequestStatus.CANCELLED) return false;
            if (otherReq.departureDate !== reqDate) return false;
            const isUsing = otherReq.assignments?.some(a => type === 'driver' ? a.driverId === id : a.busId === id);
            return isUsing && checkTimeOverlap(depTime, retTime, otherReq.departureTime, otherReq.returnTime);
        });
        if (hasConflict) return false;
    }
    return true;
  };

  const getActiveViewLabel = () => {
    if (viewMode === 'day') return referenceDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
    if (viewMode === 'week') {
        const start = getStartOfWeek(referenceDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `Semana de ${start.getDate()} a ${end.getDate()} de ${end.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`;
    }
    if (viewMode === 'month') return referenceDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    return "Intervalo Personalizado";
  };

  const handleEntitySelectChange = (val: string) => {
      if (val === 'ADD_NEW_ENTITY') {
          setIsQuickAddingEntity(true);
          setFormData({ ...formData, requesterName: '' });
      } else {
          setIsQuickAddingEntity(false);
          setFormData({ ...formData, requesterName: val });
      }
  };

  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-6">
      {!externalEditRequest && (
        <>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="space-y-3">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Pedidos</h2>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                            {(['day', 'week', 'month', 'range'] as ViewMode[]).map(m => (
                                <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest ${viewMode === m ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
                                    {m === 'day' ? 'Dia' : m === 'week' ? 'Semana' : m === 'month' ? 'Mês' : 'Intervalo'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black hover:bg-emerald-700 transition shadow-lg text-[9px] uppercase tracking-widest flex items-center gap-2" title="Exportar período actual">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Excel Período
                    </button>
                    <button onClick={handleExportAnnualExcel} className="bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-black hover:bg-emerald-900 transition shadow-lg text-[9px] uppercase tracking-widest flex items-center gap-2" title="Exportar todo o ano em abas mensais">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Excel Anual
                    </button>
                    <button onClick={() => { setFormData({ status: RequestStatus.PENDING, departureDate: formatDateISO(new Date()), passengerCount: 1, requesterName: '', assignments: [{ driverId: '', busId: '' }], notes: '' }); setIsQuickAddingEntity(false); setIsRecurrent(false); setSelectedWeekdays([]); setShowModal(true); }}
                        className="bg-slate-900 text-[#FFA500] px-6 py-2.5 rounded-xl font-black hover:bg-black transition shadow-lg text-[9px] uppercase tracking-widest">+ Novo Pedido</button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                {viewMode !== 'range' ? (
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{getActiveViewLabel()}</span>
                        <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase">De:</span>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-black outline-none" />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase">A:</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-black outline-none" />
                        </div>
                    </div>
                )}
                
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setShowCompleted(false)} className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest ${!showCompleted ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Ativos</button>
                    <button onClick={() => setShowCompleted(true)} className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest ${showCompleted ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Concluídos</button>
                </div>
            </div>
          </div>

          <div className="space-y-8">
            {sortedDates.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] text-center border border-slate-100">
                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-sm">Nenhum pedido encontrado para este período.</p>
                </div>
            ) : (
                sortedDates.map(date => (
                    <div key={date} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50/80 px-8 py-4 border-b border-slate-200">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{new Date(date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                            <thead className="bg-slate-50/30 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Requerente / Destino / Obs</th>
                                    <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Horário / Pax</th>
                                    <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Recursos Alocados</th>
                                    <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {groupedRequests[date].map(req => {
                                    const hasAssignments = req.assignments && req.assignments.length > 0;
                                    const totalCap = calculateTotalCapacity(req.assignments, data.buses);
                                    const isInsufficient = hasAssignments && totalCap < req.passengerCount;
                                    
                                    const rowStyle = !hasAssignments 
                                      ? "bg-rose-50/50 border-l-[6px] border-l-rose-400" 
                                      : isInsufficient 
                                        ? "bg-amber-50/50 border-l-[6px] border-l-amber-500" 
                                        : "hover:bg-slate-50/50";

                                    return (
                                        <tr key={req.id} className={`transition-all ${rowStyle}`}>
                                            <td className="px-8 py-5">
                                                <p className="font-black text-slate-900 text-sm uppercase leading-tight">{req.requesterName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{req.destination}</p>
                                                {req.notes && (
                                                    <p className="text-[9px] text-slate-500 mt-2 italic bg-slate-100/50 px-2 py-1 rounded inline-block max-w-[200px] truncate" title={req.notes}>
                                                        “{req.notes}”
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex gap-4">
                                                    <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase">Saída</span><span className="text-xs font-black">{req.departureTime}</span></div>
                                                    <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase">Pax</span><span className={`text-xs font-black ${isInsufficient ? 'text-amber-600' : ''}`}>{req.passengerCount}</span></div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {!hasAssignments ? (
                                                    <button onClick={() => openEditModal(req)} className="text-[9px] font-black bg-rose-600 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-rose-200">Escolher Motorista/autocarro</button>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {req.assignments.map((asgn, i) => {
                                                            const dr = data.drivers.find(d => d.id === asgn.driverId);
                                                            const bu = data.buses.find(b => b.id === asgn.busId);
                                                            return (
                                                                <div key={i} onClick={() => openEditModal(req)} className="text-[8px] font-bold px-2 py-0.5 rounded border bg-slate-50 border-slate-200 text-slate-600 cursor-pointer hover:bg-slate-100 uppercase">
                                                                    {bu?.plate} ({dr?.name.split(' ')[0]})
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right flex justify-end gap-2">
                                                <button onClick={() => openEditModal(req)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                {hasAssignments && req.status !== RequestStatus.COMPLETED && (
                                                    <button onClick={() => handleStatusChange(req.id, RequestStatus.COMPLETED)} className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100 uppercase">Concluir</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">{formData.id ? 'Editar Serviço Municipal' : 'Novo Serviço Municipal'}</h3>
              <button onClick={() => { setShowModal(false); onCloseEdit?.(); }} className="text-slate-300 hover:text-slate-900 text-3xl font-light focus:outline-none">&times;</button>
            </div>
            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requerente Oficial</label>
                    <div className="space-y-2">
                      {!isQuickAddingEntity ? (
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-2 focus:ring-slate-900 outline-none appearance-none" 
                            value={formData.requesterName} 
                            onChange={e => handleEntitySelectChange(e.target.value)}
                        >
                            <option value="">Escolher Organização...</option>
                            <option value="ADD_NEW_ENTITY" className="text-blue-600 font-bold">+ Adicionar Nova Entidade...</option>
                            {data.entities.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <input 
                            placeholder="Nome da Nova Entidade" 
                            className="flex-1 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
                            value={quickEntityName}
                            onChange={e => setQuickEntityName(e.target.value)}
                            autoFocus
                          />
                          <button 
                            onClick={() => setIsQuickAddingEntity(false)} 
                            className="text-[10px] font-black text-slate-400 uppercase px-4 hover:text-slate-900"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino / Itinerário</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-2 focus:ring-slate-900 outline-none" value={formData.destination || ''} onChange={e => setFormData({ ...formData, destination: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Passageiros</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-2 focus:ring-slate-900 outline-none" value={formData.passengerCount || 1} onChange={e => setFormData({ ...formData, passengerCount: parseInt(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Inicial do Serviço</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-2 focus:ring-slate-900 outline-none" value={formData.departureDate || ''} onChange={e => setFormData({ ...formData, departureDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partida</label>
                    <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-2 focus:ring-slate-900 outline-none" value={formData.departureTime || ''} onChange={e => setFormData({ ...formData, departureTime: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retorno Previsto</label>
                    <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-2 focus:ring-slate-900 outline-none" value={formData.returnTime || ''} onChange={e => setFormData({ ...formData, returnTime: e.target.value })} />
                  </div>
                  
                  {/* Secção de Recorrência - Apenas para Novos Pedidos */}
                  {!formData.id && (
                    <div className="md:col-span-2 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="text-lg">🔄</span> Pedido Recorrente (Semanal)
                            </label>
                            <button 
                                onClick={() => setIsRecurrent(!isRecurrent)}
                                className={`w-12 h-6 rounded-full transition-all relative ${isRecurrent ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurrent ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                        
                        {isRecurrent && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Repetir nos dias:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {weekdays.map((day, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => toggleWeekday(idx)}
                                                className={`w-10 h-10 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${selectedWeekdays.includes(idx) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Repetir até à data:</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-slate-900"
                                        value={recurrenceEndDate}
                                        onChange={e => setRecurrenceEndDate(e.target.value)}
                                        min={formData.departureDate}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 italic">Será criado um pedido independente para cada dia selecionado até à data limite.</p>
                            </div>
                        )}
                    </div>
                  )}

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações</label>
                    <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-2 focus:ring-slate-900 outline-none min-h-[100px]" 
                        value={formData.notes || ''} 
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Indique detalhes adicionais sobre o serviço..."
                    />
                  </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Recursos Alocados</h4>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-2 ${isCapacityCritical ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isCapacityCritical ? '⚠️ Capacidade Insuficiente' : '✅ Capacidade Garantida'} ({currentModalCapacity} lug.)
                    </div>
                 </div>
                 <div className="space-y-3">
                    {formData.assignments?.map((asgn, idx) => (
                        <div key={idx} className="flex gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 items-end animate-in fade-in duration-300">
                            <div className="flex-1 space-y-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Motorista</label>
                                <select 
                                  className="w-full text-xs font-black bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-1 focus:ring-slate-900 outline-none" 
                                  value={asgn.driverId} 
                                  onChange={e => {
                                    const next = (formData.assignments || []).map((a, i) => i === idx ? { ...a, driverId: e.target.value } : a);
                                    setFormData({ ...formData, assignments: next });
                                  }}
                                >
                                    <option value="">Escolher Motorista...</option>
                                    {data.drivers
                                      .filter(d => 
                                        d.id === asgn.driverId || 
                                        checkResourceAvailability('driver', d.id, formData.departureDate!, formData.departureTime!, formData.returnTime!, formData.id, idx, formData.assignments!)
                                      )
                                      .map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                      ))
                                    }
                                </select>
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Viatura</label>
                                <select 
                                  className="w-full text-xs font-black bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-1 focus:ring-slate-900 outline-none" 
                                  value={asgn.busId} 
                                  onChange={e => {
                                    const next = (formData.assignments || []).map((a, i) => i === idx ? { ...a, busId: e.target.value } : a);
                                    setFormData({ ...formData, assignments: next });
                                  }}
                                >
                                    <option value="">Escolher Viatura...</option>
                                    {data.buses
                                      .filter(b => 
                                        b.id === asgn.busId || 
                                        checkResourceAvailability('bus', b.id, formData.departureDate!, formData.departureTime!, formData.returnTime!, formData.id, idx, formData.assignments!)
                                      )
                                      .map(b => (
                                        <option key={b.id} value={b.id}>{b.plate} ({b.capacity}L)</option>
                                      ))
                                    }
                                </select>
                            </div>
                            <button onClick={() => setFormData({ ...formData, assignments: formData.assignments?.filter((_, i) => i !== idx) })} className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors mb-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))}
                    <button onClick={() => setFormData({ ...formData, assignments: [...(formData.assignments || []), { driverId: '', busId: '' }] })} className="w-full py-4 border-2 border-dashed border-slate-100 rounded-[2rem] text-[9px] font-black text-slate-300 hover:text-slate-900 hover:border-slate-300 transition-all uppercase tracking-[0.2em] focus:outline-none">+ Adicionar Viatura à Equipa</button>
                 </div>
              </div>
            </div>
            <div className="p-10 bg-slate-50 flex justify-end gap-6 border-t border-slate-100">
              <button onClick={() => { setShowModal(false); onCloseEdit?.(); }} className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Cancelar</button>
              <button onClick={handleSave} className="bg-slate-900 text-[#FFA500] px-12 py-4 rounded-2xl font-black text-xs shadow-xl shadow-slate-900/10 hover:bg-black transition-all transform active:scale-95 uppercase tracking-widest">
                {isRecurrent ? 'Gerar Pedidos Recorrentes' : 'Guardar Serviço'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManager;
