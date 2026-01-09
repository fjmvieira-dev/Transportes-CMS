
import React, { useState } from 'react';
import { AppData, Entity, ContactPerson } from '../types';
import { storageService } from '../services/storageService';

const EntityManager: React.FC<{ data: AppData; onUpdate: () => void }> = ({ data, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  
  // Estado do formulário da entidade
  const [entityForm, setEntityForm] = useState<Partial<Entity>>({
    name: '',
    address: '',
    phone: '',
    contactPersons: []
  });

  // Estado para novo contacto (sub-formulário)
  const [newContact, setNewContact] = useState<Partial<ContactPerson>>({
    name: '',
    phone: '',
    position: ''
  });

  const handleSave = () => {
    if (!entityForm.name?.trim()) {
      alert("O nome da entidade é obrigatório.");
      return;
    }
    
    const finalEntity: Entity = {
      id: editingEntity?.id || Math.random().toString(36).substr(2, 9),
      name: entityForm.name.trim(),
      address: entityForm.address || '',
      phone: entityForm.phone || '',
      contactPersons: entityForm.contactPersons || []
    };

    let updatedEntities: Entity[];
    if (editingEntity) {
      updatedEntities = data.entities.map(e => e.id === editingEntity.id ? finalEntity : e);
    } else {
      updatedEntities = [...data.entities, finalEntity];
    }
    
    storageService.updateEntities(updatedEntities);
    onUpdate();
    closeModal();
  };

  const closeModal = () => {
    setEditingEntity(null);
    setEntityForm({ name: '', address: '', phone: '', contactPersons: [] });
    setNewContact({ name: '', phone: '', position: '' });
    setShowModal(false);
  };

  const openEdit = (entity: Entity) => {
    setEditingEntity(entity);
    setEntityForm({ ...entity });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Eliminar esta entidade? Todos os contactos associados serão removidos.')) return;
    storageService.updateEntities(data.entities.filter(e => e.id !== id));
    onUpdate();
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) {
      alert("Nome e telefone são obrigatórios para o contacto.");
      return;
    }
    const contact: ContactPerson = {
      id: Math.random().toString(36).substr(2, 9),
      name: newContact.name,
      phone: newContact.phone,
      position: newContact.position || 'N/A'
    };
    setEntityForm({
      ...entityForm,
      contactPersons: [...(entityForm.contactPersons || []), contact]
    });
    setNewContact({ name: '', phone: '', position: '' });
  };

  const removeContact = (id: string) => {
    setEntityForm({
      ...entityForm,
      contactPersons: entityForm.contactPersons?.filter(cp => cp.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Entidades Requerentes</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Base de dados de organizações e contactos</p>
        </div>
        <button 
          onClick={() => { setEditingEntity(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition shadow-xl shadow-blue-100"
        >
          + Nova Entidade
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {data.entities.map(entity => (
          <div key={entity.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="font-black text-slate-800 text-lg leading-tight uppercase">{entity.name}</h3>
                <div className="flex items-center gap-2 text-slate-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{entity.address || 'Sem morada'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(entity)} className="p-2 bg-slate-50 rounded-xl text-blue-600 hover:bg-blue-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <button onClick={() => handleDelete(entity.id)} className="p-2 bg-slate-50 rounded-xl text-rose-500 hover:bg-rose-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Telefone Geral</p>
                    <p className="text-xs font-black text-slate-700">{entity.phone || '—'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Contactos Ativos</p>
                    <p className="text-xs font-black text-slate-700">{entity.contactPersons.length}</p>
                </div>
            </div>

            {entity.contactPersons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Contacto Principal</p>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-black">
                            {entity.contactPersons[0].name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-800 leading-none">{entity.contactPersons[0].name}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1">{entity.contactPersons[0].position}</p>
                        </div>
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 my-8">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{editingEntity ? 'Editar Entidade' : 'Nova Entidade'}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preencha os dados oficiais e pessoas de contacto</p>
              </div>
              <button onClick={closeModal} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 transition shadow-sm">&times;</button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Secção 1: Dados Gerais */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <span className="bg-blue-600 text-white p-1.5 rounded-lg text-[10px] font-black">01</span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Informação Geral</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Nome da Organização *</label>
                        <input 
                            autoFocus
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            value={entityForm.name}
                            onChange={e => setEntityForm({...entityForm, name: e.target.value})}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Morada Oficial</label>
                        <input 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            value={entityForm.address}
                            onChange={e => setEntityForm({...entityForm, address: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Telefone Geral</label>
                        <input 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            value={entityForm.phone}
                            onChange={e => setEntityForm({...entityForm, phone: e.target.value})}
                        />
                    </div>
                </div>
              </div>

              {/* Secção 2: Pessoas de Contacto */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <span className="bg-emerald-500 text-white p-1.5 rounded-lg text-[10px] font-black">02</span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Pessoas de Contacto</h4>
                </div>

                {/* Lista de contactos existentes */}
                <div className="space-y-3">
                    {entityForm.contactPersons?.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum contacto adicionado</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {entityForm.contactPersons?.map(cp => (
                                <div key={cp.id} className="bg-white border border-slate-200 p-4 rounded-2xl relative group shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black">
                                            {cp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 leading-tight">{cp.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{cp.position}</p>
                                            <p className="text-[10px] font-black text-blue-600 mt-0.5">{cp.phone}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeContact(cp.id)}
                                        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 transition"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Formulário para novo contacto */}
                <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 space-y-4 shadow-inner">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Adicionar Novo Contacto</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Nome Completo</label>
                            <input 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500" 
                                value={newContact.name}
                                onChange={e => setNewContact({...newContact, name: e.target.value})}
                                placeholder="ex: João Pereira"
                            />
                        </div>
                        <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Telemóvel / Directo</label>
                            <input 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500" 
                                value={newContact.phone}
                                onChange={e => setNewContact({...newContact, phone: e.target.value})}
                                placeholder="9xx xxx xxx"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Cargo / Função</label>
                            <input 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500" 
                                value={newContact.position}
                                onChange={e => setNewContact({...newContact, position: e.target.value})}
                                placeholder="ex: Chefe de Secretaria"
                            />
                        </div>
                        <div className="flex items-end">
                            <button 
                                onClick={addContact}
                                className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                            >
                                + Incluir na Lista
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={closeModal} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition">Sair sem Gravar</button>
              <button onClick={handleSave} className="px-10 py-3 text-sm font-black bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-95 uppercase tracking-widest">Finalizar e Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityManager;
