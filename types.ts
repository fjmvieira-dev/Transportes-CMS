
export enum RequestStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Shift {
  id: string;
  name: string;
  hours: string;
  color: string;
  slots: number;
}

export interface ContactPerson {
  id: string;
  name: string;
  phone: string;
  position: string;
}

export interface Entity {
  id: string;
  name: string;
  address: string;
  phone: string;
  contactPersons: ContactPerson[];
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  currentShiftId?: string; // ID do turno atribuído
}

export interface Unavailability {
  id: string;
  driverId: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  type: 'FERIAS' | 'PAUSA' | 'OUTRO';
  description: string;
}

export interface Bus {
  id: string;
  plate: string;
  model: string;
  capacity: number;
}

export interface Assignment {
  driverId: string;
  busId: string;
}

export interface BusRequest {
  id: string;
  requesterName: string;
  destination: string;
  departureDate: string; // ISO date
  departureTime: string;
  returnTime: string;
  passengerCount: number;
  status: RequestStatus;
  assignments: Assignment[];
  notes?: string; // Observações
}

export interface AppData {
  drivers: Driver[];
  buses: Bus[];
  requests: BusRequest[];
  unavailabilities: Unavailability[];
  entities: Entity[];
  shifts: Shift[]; // Definições de turnos configuráveis
}
