import { v4 as uuidv4 } from "uuid";
import {
  PropertyAgent,
  CreatePropertyAgentDto,
  UpdatePropertyAgentDto,
  Property,
  CreatePropertyDto,
  UpdatePropertyDto,
  Family,
  CreateFamilyDto,
  UpdateFamilyDto,
  Tenant,
  CreateTenantDto,
  UpdateTenantDto,
  Note,
  CreateNoteDto,
  UpdateNoteDto,
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
} from "./types";

const agents: Map<string, PropertyAgent> = new Map();

export function getAllAgents(): PropertyAgent[] {
  return Array.from(agents.values());
}

export function getAgentById(id: string): PropertyAgent | undefined {
  return agents.get(id);
}

export function createAgent(dto: CreatePropertyAgentDto): PropertyAgent {
  const now = new Date().toISOString();
  const agent: PropertyAgent = {
    id: uuidv4(),
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    mobileNumber: dto.mobileNumber,
    createdAt: now,
    updatedAt: now,
  };
  agents.set(agent.id, agent);
  return agent;
}

export function updateAgent(
  id: string,
  dto: UpdatePropertyAgentDto
): PropertyAgent | undefined {
  const agent = agents.get(id);
  if (!agent) return undefined;

  const updated: PropertyAgent = {
    ...agent,
    ...dto,
    updatedAt: new Date().toISOString(),
  };
  agents.set(id, updated);
  return updated;
}

export function deleteAgent(id: string): boolean {
  if (!agents.has(id)) return false;
  const propIds = Array.from(properties.values()).filter(p => p.agentId === id).map(p => p.id);
  for (const pid of propIds) deleteProperty(pid);
  const noteIds = Array.from(notes.values()).filter(n => n.agentId === id).map(n => n.id);
  for (const nid of noteIds) notes.delete(nid);
  const reminderIds = Array.from(reminders.values()).filter(r => r.agentId === id).map(r => r.id);
  for (const rid of reminderIds) reminders.delete(rid);
  return agents.delete(id);
}

const properties: Map<string, Property> = new Map();

export function getPropertiesByAgent(agentId: string): Property[] {
  return Array.from(properties.values()).filter((p) => p.agentId === agentId);
}

export function getPropertyById(id: string): Property | undefined {
  return properties.get(id);
}

export function createProperty(
  agentId: string,
  dto: CreatePropertyDto
): Property {
  const now = new Date().toISOString();
  const property: Property = {
    id: uuidv4(),
    agentId,
    address: dto.address,
    city: dto.city,
    state: dto.state,
    zipCode: dto.zipCode,
    rentAmount: dto.rentAmount,
    createdAt: now,
    updatedAt: now,
  };
  properties.set(property.id, property);
  return property;
}

export function updateProperty(
  id: string,
  dto: UpdatePropertyDto
): Property | undefined {
  const property = properties.get(id);
  if (!property) return undefined;

  const updated: Property = {
    ...property,
    ...dto,
    updatedAt: new Date().toISOString(),
  };
  properties.set(id, updated);
  return updated;
}

export function deleteProperty(id: string): boolean {
  if (!properties.has(id)) return false;
  const familyIds = Array.from(families.values()).filter(f => f.propertyId === id).map(f => f.id);
  for (const fid of familyIds) deleteFamily(fid);
  for (const note of notes.values()) {
    if (note.propertyId === id) {
      notes.set(note.id, { ...note, propertyId: null });
    }
  }
  for (const reminder of reminders.values()) {
    if (reminder.propertyId === id) {
      reminders.set(reminder.id, { ...reminder, propertyId: null });
    }
  }
  return properties.delete(id);
}

const families: Map<string, Family> = new Map();

export function getFamilyByProperty(propertyId: string): Family | undefined {
  return Array.from(families.values()).find(
    (f) => f.propertyId === propertyId
  );
}

export function getFamilyById(id: string): Family | undefined {
  return families.get(id);
}

export function createFamily(
  propertyId: string,
  dto: CreateFamilyDto
): Family {
  const now = new Date().toISOString();
  const family: Family = {
    id: uuidv4(),
    propertyId,
    familyName: dto.familyName,
    moveInDate: dto.moveInDate,
    createdAt: now,
    updatedAt: now,
  };
  families.set(family.id, family);
  return family;
}

export function updateFamily(
  id: string,
  dto: UpdateFamilyDto
): Family | undefined {
  const family = families.get(id);
  if (!family) return undefined;

  const updated: Family = {
    ...family,
    ...dto,
    updatedAt: new Date().toISOString(),
  };
  families.set(id, updated);
  return updated;
}

export function deleteFamily(id: string): boolean {
  if (!families.has(id)) return false;
  const tenantIds = Array.from(tenants.values()).filter(t => t.familyId === id).map(t => t.id);
  for (const tid of tenantIds) tenants.delete(tid);
  return families.delete(id);
}

export function familyExistsForProperty(propertyId: string): boolean {
  return Array.from(families.values()).some((f) => f.propertyId === propertyId);
}

const tenants: Map<string, Tenant> = new Map();

export function getTenantsByFamily(familyId: string): Tenant[] {
  return Array.from(tenants.values()).filter((t) => t.familyId === familyId);
}

export function getTenantById(id: string): Tenant | undefined {
  return tenants.get(id);
}

export function createTenant(
  familyId: string,
  dto: CreateTenantDto
): Tenant {
  const now = new Date().toISOString();
  const tenant: Tenant = {
    id: uuidv4(),
    familyId,
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phoneNumber: dto.phoneNumber,
    isPrimary: dto.isPrimary,
    createdAt: now,
    updatedAt: now,
  };
  tenants.set(tenant.id, tenant);
  return tenant;
}

export function updateTenant(
  id: string,
  dto: UpdateTenantDto
): Tenant | undefined {
  const tenant = tenants.get(id);
  if (!tenant) return undefined;

  const updated: Tenant = {
    ...tenant,
    ...dto,
    updatedAt: new Date().toISOString(),
  };
  tenants.set(id, updated);
  return updated;
}

export function deleteTenant(id: string): boolean {
  return tenants.delete(id);
}

const notes: Map<string, Note> = new Map();

export function getNotesByAgent(agentId: string): Note[] {
  return Array.from(notes.values()).filter((n) => n.agentId === agentId);
}

export function getNoteById(id: string): Note | undefined {
  return notes.get(id);
}

export function createNote(agentId: string, dto: CreateNoteDto): Note {
  const now = new Date().toISOString();
  const note: Note = {
    id: uuidv4(),
    agentId,
    propertyId: dto.propertyId ?? null,
    title: dto.title,
    content: dto.content,
    createdAt: now,
    updatedAt: now,
  };
  notes.set(note.id, note);
  return note;
}

export function updateNote(id: string, dto: UpdateNoteDto): Note | undefined {
  const note = notes.get(id);
  if (!note) return undefined;

  const updated: Note = {
    ...note,
    ...dto,
    propertyId: dto.propertyId !== undefined ? (dto.propertyId ?? null) : note.propertyId,
    updatedAt: new Date().toISOString(),
  };
  notes.set(id, updated);
  return updated;
}

export function deleteNote(id: string): boolean {
  return notes.delete(id);
}

const reminders: Map<string, Reminder> = new Map();

export function getRemindersByAgent(agentId: string): Reminder[] {
  return Array.from(reminders.values()).filter((r) => r.agentId === agentId);
}

export function getReminderById(id: string): Reminder | undefined {
  return reminders.get(id);
}

export function createReminder(
  agentId: string,
  dto: CreateReminderDto
): Reminder {
  const now = new Date().toISOString();
  const reminder: Reminder = {
    id: uuidv4(),
    agentId,
    propertyId: dto.propertyId ?? null,
    title: dto.title,
    description: dto.description,
    dueDate: dto.dueDate,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
  reminders.set(reminder.id, reminder);
  return reminder;
}

export function updateReminder(
  id: string,
  dto: UpdateReminderDto
): Reminder | undefined {
  const reminder = reminders.get(id);
  if (!reminder) return undefined;

  const updated: Reminder = {
    ...reminder,
    ...dto,
    propertyId: dto.propertyId !== undefined ? (dto.propertyId ?? null) : reminder.propertyId,
    updatedAt: new Date().toISOString(),
  };
  reminders.set(id, updated);
  return updated;
}

export function deleteReminder(id: string): boolean {
  return reminders.delete(id);
}
