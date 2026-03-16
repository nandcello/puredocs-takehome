export interface PropertyAgent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyAgentDto {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
}

export interface UpdatePropertyAgentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
}

export interface Property {
  id: string;
  agentId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  rentAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyDto {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  rentAmount: number;
}

export interface UpdatePropertyDto {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  rentAmount?: number;
}

export interface Family {
  id: string;
  propertyId: string;
  familyName: string;
  moveInDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFamilyDto {
  familyName: string;
  moveInDate: string;
}

export interface UpdateFamilyDto {
  familyName?: string;
  moveInDate?: string;
}

export interface Tenant {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isPrimary: boolean;
}

export interface UpdateTenantDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  isPrimary?: boolean;
}

export interface Note {
  id: string;
  agentId: string;
  propertyId: string | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteDto {
  propertyId?: string | null;
  title: string;
  content: string;
}

export interface UpdateNoteDto {
  propertyId?: string | null;
  title?: string;
  content?: string;
}

export interface Reminder {
  id: string;
  agentId: string;
  propertyId: string | null;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderDto {
  propertyId?: string | null;
  title: string;
  description: string;
  dueDate: string;
}

export interface UpdateReminderDto {
  propertyId?: string | null;
  title?: string;
  description?: string;
  dueDate?: string;
  isCompleted?: boolean;
}
