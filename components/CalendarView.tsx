
import React, { useState } from 'react';
import { AppData, BusRequest } from '../types';
import { calculateTotalCapacity } from './RequestManager';

interface CalendarViewProps {
  data: AppData;
  onEventClick?: (req: BusRequest) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ data, onEventClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear] = useState(new Date().getFullYear());

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const startDay = new Date(currentYear, currentMonth, 1).getDay();
  
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const getDayContent = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const requests = data.requests.filter(r => r.departureDate === dateStr);
    const absences = data.unavailabilities.filter(u => 
      u.startDate <= dateStr && u.endDate >= dateStr
    );
    return { requests, absences };
  };

  const days = Array.from({ length: daysInMonth(currentMonth, currentYear) }, (_, i) => i + 1);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{monthNames[currentMonth]} {currentYear}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-lg overflow-hidden flex-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
          <div key={d} className="bg-slate-50 text-center text-[10px] font-bold text-slate-400 uppercase py-3">{d}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="bg-white/50" />)}
        {days.map(day => {
          const { requests, absences } = getDayContent(day);
          return (
            <div key={day} className="bg-white min-h-[110px] p-1 hover:bg-slate-50 transition group">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-800 transition px-1">{day}</span>
              </div>
              <div className="space-y-1">
                {requests.map(r => {
                  const hasAssignments = r.assignments && r.assignments.length > 0;
                  const totalCap = calculateTotalCapacity(r.assignments, data.buses);
                  const isInsufficient = hasAssignments && totalCap < r.passengerCount;

                  let statusClasses = 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse-slow'; // Pendente
                  if (hasAssignments) {
                    if (isInsufficient) {
                      statusClasses = 'bg-orange-100 text-orange-800 border-orange-300'; // Insuficiente
                    } else {
                      statusClasses = 'bg-emerald-100 text-emerald-800 border-emerald-200'; // OK
                    }
                  }

                  return (
                    <button 
                      key={r.id} 
                      onClick={() => onEventClick?.(r)}
                      className={`w-full text-left text-[9px] p-1.5 rounded-md font-bold truncate transition-transform active:scale-95 border ${statusClasses}`}
                    >
                      {isInsufficient ? '⚠️ ' : '🚍 '}{r.requesterName}
                    </button>
                  );
                })}
                {absences.map(a => (
                  <div key={a.id} className="text-[9px] bg-slate-100 text-slate-500 p-1.5 rounded-md font-medium border border-slate-200 italic">
                    👤 {data.drivers.find(d => d.id === a.driverId)?.name} (Indisp.)
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
