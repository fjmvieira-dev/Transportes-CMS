
import React, { useState } from 'react';
import { AppData, Bus } from '../types';
import { storageService } from '../services/storageService';

const BusList: React.FC<{ data: AppData; onUpdate: () => void }> = ({ data, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [form, setForm] = useState<Partial<Bus>>({ capacity: 50 });

  const saveBus = () => {
    if (!form.plate) return;
    
    if (editingBus) {
      const updated = data.buses.map(b => b.id === editingBus.id ? { ...b, ...form } as Bus : b);
      storageService.updateBuses(updated);
    } else {
      const newBus: Bus = {
        ...(form as Bus),
        id: Math.random().toString(36).substr(2, 9),
      };
      storageService.updateBuses([...data.buses, newBus]);
    }
    
    setShowModal(false);
    setEditingBus(null);
    onUpdate();
  };

  const openEdit = (bus: Bus) => {
    setEditingBus(bus);
    setForm(bus);
    setShowModal(true);
  };

  const deleteBus = (id: string) => {
    if (!confirm('Eliminar este autocarro da frota?')) return;
    storageService.updateBuses(data.buses.filter(b => b.id !== id));
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Frota Municipal</h2>
          <p className="text-slate-500">Autocarros disponíveis no concelho de Soure</p>
        </div>
        <button 
          onClick={() => { setEditingBus(null); setForm({ capacity: 50 }); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          + Adicionar Autocarro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.buses.map(bus => (
          <div key={bus.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">🚌</div>
              <div>
                <h3 className="font-bold text-slate-800">{bus.model}</h3>
                <p className="text-xs text-slate-400">{bus.plate} • {bus.capacity} Lugares</p>
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => openEdit(bus)} className="text-blue-500 text-xs font-bold">Editar</button>
              <button onClick={() => deleteBus(bus.id)} className="text-rose-500 text-xs font-bold">Excluir</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100"><h3 className="text-xl font-bold">{editingBus ? 'Editar Autocarro' : 'Registar Autocarro'}</h3></div>
            <div className="p-6 space-y-4">
              <input placeholder="Marca / Modelo" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.model || ''} onChange={e => setForm({...form, model: e.target.value})} />
              <input placeholder="Matrícula (ex: AA-00-XX)" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm uppercase" value={form.plate || ''} onChange={e => setForm({...form, plate: e.target.value})} />
              <input type="number" placeholder="Lotação Máxima" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.capacity || 0} onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} />
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="text-sm px-4 font-bold text-slate-600">Cancelar</button>
              <button onClick={saveBus} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md">Gravar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusList;
