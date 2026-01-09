
import { AppData, Driver, Bus, BusRequest, Unavailability, Entity, Shift } from '../types';

const STORAGE_KEY = 'soure_bus_management_data';

const initialShifts: Shift[] = [
  { id: 'S1', name: 'Turno A (Madrugada)', hours: '06:30-09:30 // 15:00-19:00', color: 'orange', slots: 2 },
  { id: 'S2', name: 'Turno B (Manhã/Tarde)', hours: '07:30-10:30 // 15:30-19:30', color: 'blue', slots: 5 },
  { id: 'S3', name: 'Turno C (Normal)', hours: '10:00-14:00 // 15:00-18:00', color: 'emerald', slots: 2 },
];

const initialData: AppData = {
  drivers: [
    { id: 'd1', name: 'João Silva', licenseNumber: 'C-121', phone: '912345671', currentShiftId: 'S1' },
    { id: 'd2', name: 'Maria Santos', licenseNumber: 'D-122', phone: '912345672', currentShiftId: 'S1' },
    { id: 'd3', name: 'Carlos Oliveira', licenseNumber: 'C-123', phone: '912345673', currentShiftId: 'S2' },
    { id: 'd4', name: 'António Ferreira', licenseNumber: 'D-124', phone: '912345674', currentShiftId: 'S2' },
    { id: 'd5', name: 'Paulo Jorge', licenseNumber: 'C-125', phone: '912345675', currentShiftId: 'S2' },
    { id: 'd6', name: 'Ricardo Melo', licenseNumber: 'D-126', phone: '912345676', currentShiftId: 'S2' },
    { id: 'd7', name: 'Fernando Costa', licenseNumber: 'C-127', phone: '912345677', currentShiftId: 'S2' },
    { id: 'd8', name: 'Manuel Dias', licenseNumber: 'D-128', phone: '912345678', currentShiftId: 'S3' },
    { id: 'd9', name: 'José Luís', licenseNumber: 'C-129', phone: '912345679', currentShiftId: 'S3' }
  ],
  buses: [
    { id: 'b1', plate: 'AA-00-XX', model: 'Mercedes Sprinter', capacity: 22 },
    { id: 'b2', plate: 'BB-11-YY', model: 'Volvo 9700', capacity: 55 },
    { id: 'b3', plate: 'CC-22-ZZ', model: 'Iveco Bus', capacity: 35 }
  ],
  entities: [
    { 
      id: 'e1', 
      name: 'Agrupamento de Escolas de Soure', 
      address: 'Rua da Escola, Soure', 
      phone: '239500100',
      contactPersons: [
        { id: 'cp1', name: 'Dr. Alberto Sousa', phone: '910000111', position: 'Director' }
      ]
    }
  ],
  requests: [],
  unavailabilities: [],
  shifts: initialShifts
};

export const storageService = {
  getData: (): AppData => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return initialData;
    const parsed = JSON.parse(data);
    // Garantir que campos novos existem para migração suave
    if (!parsed.shifts) parsed.shifts = initialShifts;
    return parsed;
  },
  saveData: (data: AppData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  updateDrivers: (drivers: Driver[]) => {
    const data = storageService.getData();
    storageService.saveData({ ...data, drivers });
  },
  updateShifts: (shifts: Shift[]) => {
    const data = storageService.getData();
    storageService.saveData({ ...data, shifts });
  },
  updateBuses: (buses: Bus[]) => {
    const data = storageService.getData();
    storageService.saveData({ ...data, buses });
  },
  updateRequests: (requests: BusRequest[]) => {
    const data = storageService.getData();
    storageService.saveData({ ...data, requests });
  },
  updateUnavailabilities: (unavailabilities: Unavailability[]) => {
    const data = storageService.getData();
    storageService.saveData({ ...data, unavailabilities });
  },
  updateEntities: (entities: Entity[]) => {
    const data = storageService.getData();
    storageService.saveData({ ...data, entities });
  }
};
