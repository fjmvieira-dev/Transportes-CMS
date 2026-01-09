
import React, { useState } from 'react';
import { AppData, Driver, Unavailability } from '../types';
import { storageService } from '../services/storageService';

const DriverList: React.FC<{ data: AppData; onUpdate: () => void }> = ({ data, onUpdate }) => {
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showUnavailModal, setShowUnavailModal] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverForm, setDriverForm] = useState<Partial<Driver>>({});
  const [unavailForm, setUnavailForm] = useState<Partial<Unavailability>>({ type: 'FERIAS' });

  const saveDriver = () => {
    if (!driverForm.name) return;
    
    if (editingDriver) {
      const updated = data.drivers.map(d => d.id === editingDriver.id ? { ...d, ...driverForm } as Driver : d);
      storageService.updateDrivers(updated);
    } else {
      const newDriver: Driver = {
        ...(driverForm as Driver),
        id: Math.random().toString(36).substr(2, 9),
      };
      storageService.updateDrivers([...data.drivers, newDriver]);
    }
    
    setShowDriverModal(false);
    setEditingDriver(null);
    onUpdate();
  };

  const openEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setDriverForm(driver);
    setShowDriverModal(true);
  };

  const deleteDriver = (id: string) => {
    if (!confirm('Eliminar este motorista?')) return;
    storageService.updateDrivers(data.drivers.filter(d => d.id !== id));
    onUpdate();
  };

  const saveUnavail = () => {
    if (!showUnavailModal || !unavailForm.startDate) return;
    const newItem: Unavailability = {
      ...(unavailForm as Unavailability),
      id: Math.random().toString(36).substr(2, 9),
      driverId: showUnavailModal,
    };
    storageService.updateUnavailabilities([...data.unavailabilities, newItem]);
    setShowUnavailModal(null);
    onUpdate();
  };

  const removeUnavail = (id: string) => {
    storageService.updateUnavailabilities(data.unavailabilities.filter(u => u.id !== id));
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Motoristas</h2>
          <p className="text-slate-500">Gestão de pessoal e períodos de ausência</p>
        </div>
        <button 
          onClick={() => { setEditingDriver(null); setDriverForm({}); setShowDriverModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          + Adicionar Motorista
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.drivers.map(driver => {
          const driverAbsences = data.unavailabilities.filter(u => u.driverId === driver.id);
          return (
            <div key={driver.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{driver.name}</h3>
                  <p className="text-xs text-slate-400">Carta: {driver.licenseNumber} • Tel: {driver.phone}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <div className="flex gap-2">
                        <button onClick={() => openEdit(driver)} className="text-[10px] text-blue-600 font-bold uppercase hover:underline">Editar</button>
                        <button onClick={() => deleteDriver(driver.id)} className="text-[10px] text-rose-500 font-bold uppercase hover:underline">Eliminar</button>
                    </div>
                    <button 
                        onClick={() => setShowUnavailModal(driver.id)}
                        className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full hover:bg-slate-200 font-semibold"
                    >
                        Registar Ausência
                    </button>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ausências Programadas</p>
                {driverAbsences.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhuma ausência registada.</p>
                ) : (
                  driverAbsences.map(ua => (
                    <div key={ua.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-100">
                      <span className={`font-bold px-1 rounded ${ua.type === 'FERIAS' ? 'text-green-600' : 'text-amber-600'}`}>
                        {ua.type}: {ua.startDate} a {ua.endDate}
                      </span>
                      <button onClick={() => removeUnavail(ua.id)} className="text-red-400 hover:text-red-600">×</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showDriverModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100"><h3 className="text-xl font-bold">{editingDriver ? 'Editar Motorista' : 'Novo Motorista'}</h3></div>
            <div className="p-6 space-y-4">
              <input placeholder="Nome Completo" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={driverForm.name || ''} onChange={e => setDriverForm({...driverForm, name: e.target.value})} />
              <input placeholder="Nº da Carta" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={driverForm.licenseNumber || ''} onChange={e => setDriverForm({...driverForm, licenseNumber: e.target.value})} />
              <input placeholder="Telefone" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={driverForm.phone || ''} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} />
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setShowDriverModal(false)} className="text-sm px-4 font-bold text-slate-600">Sair</button>
              <button onClick={saveDriver} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md">Gravar</button>
            </div>
          </div>
        </div>
      )}

      {showUnavailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100"><h3 className="text-xl font-bold text-slate-800">Ausência: {data.drivers.find(d => d.id === showUnavailModal)?.name}</h3></div>
            <div className="p-6 space-y-4">
              <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={unavailForm.type} onChange={e => setUnavailForm({...unavailForm, type: e.target.value as any})}>
                <option value="FERIAS">Férias</option>
                <option value="PAUSA">Pausa Programada</option>
                <option value="OUTRO">Outro Motivo</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm" value={unavailForm.startDate || ''} onChange={e => setUnavailForm({...unavailForm, startDate: e.target.value})} />
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm" value={unavailForm.endDate || ''} onChange={e => setUnavailForm({...unavailForm, endDate: e.target.value})} />
              </div>
              <textarea placeholder="Observações" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={unavailForm.description || ''} onChange={e => setUnavailForm({...unavailForm, description: e.target.value})} />
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setShowUnavailModal(null)} className="text-sm px-4 font-bold text-slate-600">Cancelar</button>
              <button onClick={saveUnavail} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">Registar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverList;
