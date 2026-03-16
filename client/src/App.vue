<script setup lang="ts">
import { ref, shallowRef, reactive, onMounted, computed, watch, onWatcherCleanup } from 'vue'

interface PropertyAgent {
  id: string
  firstName: string
  lastName: string
  email: string
  mobileNumber: string
  createdAt: string
  updatedAt: string
}

interface Property {
  id: string
  agentId: string
  address: string
  city: string
  state: string
  zipCode: string
  rentAmount: number
  createdAt: string
  updatedAt: string
}

interface Family {
  id: string
  propertyId: string
  familyName: string
  moveInDate: string
  createdAt: string
  updatedAt: string
}

interface Tenant {
  id: string
  familyId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

interface Note {
  id: string
  agentId: string
  propertyId: string | null
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface Reminder {
  id: string
  agentId: string
  propertyId: string | null
  title: string
  description: string
  dueDate: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

const BASE = '/api'

// --- Composable: form + editing state for CRUD entities ---
function useCrud<T extends Record<string, any>>(defaults: T) {
  const form = reactive({ ...defaults }) as T
  const editingId = ref<string | null>(null)

  function reset() {
    Object.assign(form, defaults)
    editingId.value = null
  }

  return { form, editingId, reset }
}

// --- App state ---
type View = 'agents' | 'agent-detail'
const currentView = ref<View>('agents')
const selectedAgent = ref<PropertyAgent | null>(null)
const activeTab = ref<'properties' | 'notes' | 'reminders'>('properties')

const agents = shallowRef<PropertyAgent[]>([])
const properties = shallowRef<Property[]>([])
const notes = shallowRef<Note[]>([])
const reminders = shallowRef<Reminder[]>([])
const familyMap = shallowRef<Record<string, Family>>({})
const tenantsMap = shallowRef<Record<string, Tenant[]>>({})

const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const expandedPropertyId = ref<string | null>(null)

// --- CRUD form state (composable eliminates 6 reset functions) ---
const { form: agentForm, editingId: editingAgentId, reset: resetAgentForm } = useCrud({ firstName: '', lastName: '', email: '', mobileNumber: '' })
const { form: propertyForm, editingId: editingPropertyId, reset: resetPropertyForm } = useCrud({ address: '', city: '', state: '', zipCode: '', rentAmount: 0 })
const { form: familyForm, editingId: editingFamilyId, reset: _resetFamily } = useCrud({ familyName: '', moveInDate: '' })
const familyPropertyId = ref<string | null>(null)
const { form: tenantForm, editingId: editingTenantId, reset: _resetTenant } = useCrud({ firstName: '', lastName: '', email: '', phoneNumber: '', isPrimary: false })
const tenantFamilyId = ref<string | null>(null)
const { form: noteForm, editingId: editingNoteId, reset: resetNoteForm } = useCrud({ title: '', content: '', propertyId: '' })
const { form: reminderForm, editingId: editingReminderId, reset: resetReminderForm } = useCrud({ title: '', description: '', dueDate: '', propertyId: '' })

// Family/tenant resets need to clear extra refs
function resetFamilyForm() { _resetFamily(); familyPropertyId.value = null }
function resetTenantForm() { _resetTenant(); tenantFamilyId.value = null }


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function isOverdue(r: Reminder) {
  return !r.isCompleted && new Date(r.dueDate) < new Date()
}

async function api(url: string, options?: RequestInit) {
  const headers: Record<string, string> = { ...options?.headers as Record<string, string> }
  if (options?.body) headers['Content-Type'] = 'application/json'
  const res = await fetch(url, { ...options, headers })
  if (res.status === 204) return null
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = null }
  if (!res.ok) {
    throw new Error(data?.errors?.join(', ') || data?.error || `Request failed (${res.status})`)
  }
  return data
}


async function fetchAgents() {
  loading.value = true
  try {
    agents.value = await api(`${BASE}/agents`)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function submitAgent() {
  error.value = ''
  submitting.value = true
  try {
    if (editingAgentId.value) {
      await api(`${BASE}/agents/${editingAgentId.value}`, { method: 'PUT', body: JSON.stringify(agentForm) })
    } else {
      await api(`${BASE}/agents`, { method: 'POST', body: JSON.stringify(agentForm) })
    }
    resetAgentForm()
    await fetchAgents()
    if (selectedAgent.value) {
      selectedAgent.value = agents.value.find(a => a.id === selectedAgent.value!.id) || null
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

function editAgent(agent: PropertyAgent) {
  editingAgentId.value = agent.id
  Object.assign(agentForm, {
    firstName: agent.firstName, lastName: agent.lastName,
    email: agent.email, mobileNumber: agent.mobileNumber,
  })
}

async function deleteAgentById(id: string) {
  if (!confirm('Delete this agent and all their data?')) return
  try {
    await api(`${BASE}/agents/${id}`, { method: 'DELETE' })
    if (selectedAgent.value?.id === id) {
      selectedAgent.value = null
      currentView.value = 'agents'
    }
    await fetchAgents()
  } catch (e: any) {
    error.value = e.message
  }
}

function selectAgent(agent: PropertyAgent) {
  selectedAgent.value = agent
  currentView.value = 'agent-detail'
}

function goBack() {
  currentView.value = 'agents'
  selectedAgent.value = null
  resetAllForms()
}

function resetAllForms() {
  resetAgentForm()
  resetPropertyForm()
  resetFamilyForm()
  resetTenantForm()
  resetNoteForm()
  resetReminderForm()
  expandedPropertyId.value = null
  error.value = ''
}

// Reactive data fetching: auto-load agent detail data when selection changes (Vue 3.5 onWatcherCleanup)
watch(selectedAgent, async (agent) => {
  if (!agent) {
    properties.value = []
    notes.value = []
    reminders.value = []
    familyMap.value = {}
    tenantsMap.value = {}
    return
  }

  let stale = false
  onWatcherCleanup(() => { stale = true })

  activeTab.value = 'properties'
  expandedPropertyId.value = null

  try {
    const [props, n, r] = await Promise.all([
      api(`${BASE}/agents/${agent.id}/properties`),
      api(`${BASE}/agents/${agent.id}/notes`),
      api(`${BASE}/agents/${agent.id}/reminders`),
    ])
    if (stale) return

    properties.value = props
    notes.value = n
    reminders.value = r

    const families: Record<string, Family> = {}
    const tenants: Record<string, Tenant[]> = {}
    await Promise.all(props.map(async (prop: Property) => {
      try {
        const family = await api(`${BASE}/agents/${agent.id}/properties/${prop.id}/family`)
        if (!family) return
        families[prop.id] = family
        const t = await api(`${BASE}/agents/${agent.id}/properties/${prop.id}/family/${family.id}/tenants`)
        tenants[family.id] = t ?? []
      } catch (e: any) {
        if (!e.message?.includes('404')) console.warn(`Failed loading family for property ${prop.id}:`, e.message)
      }
    }))
    if (stale) return
    familyMap.value = families
    tenantsMap.value = tenants
  } catch (e: any) {
    if (!stale) error.value = e.message
  }
})

// Individual refetch functions for after mutations
async function fetchProperties() {
  if (!selectedAgent.value) return
  const agentId = selectedAgent.value.id
  try {
    const props: Property[] = await api(`${BASE}/agents/${agentId}/properties`)
    if (selectedAgent.value?.id !== agentId) return
    properties.value = props

    const families: Record<string, Family> = {}
    const tenants: Record<string, Tenant[]> = {}
    await Promise.all(props.map(async (prop) => {
      try {
        const family = await api(`${BASE}/agents/${agentId}/properties/${prop.id}/family`)
        if (!family) return
        families[prop.id] = family
        const t = await api(`${BASE}/agents/${agentId}/properties/${prop.id}/family/${family.id}/tenants`)
        tenants[family.id] = t ?? []
      } catch (e: any) {
        if (!e.message?.includes('404')) console.warn(`Failed loading family for property ${prop.id}:`, e.message)
      }
    }))
    if (selectedAgent.value?.id !== agentId) return
    familyMap.value = families
    tenantsMap.value = tenants
  } catch (e: any) {
    error.value = e.message
  }
}

async function fetchNotes() {
  if (!selectedAgent.value) return
  try {
    notes.value = await api(`${BASE}/agents/${selectedAgent.value.id}/notes`)
  } catch (e: any) {
    error.value = e.message
  }
}

async function fetchReminders() {
  if (!selectedAgent.value) return
  try {
    reminders.value = await api(`${BASE}/agents/${selectedAgent.value.id}/reminders`)
  } catch (e: any) {
    error.value = e.message
  }
}

async function submitProperty() {
  error.value = ''
  if (!selectedAgent.value) return
  submitting.value = true
  try {
    const body = { ...propertyForm, rentAmount: Number(propertyForm.rentAmount) }
    if (editingPropertyId.value) {
      await api(`${BASE}/agents/${selectedAgent.value.id}/properties/${editingPropertyId.value}`, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await api(`${BASE}/agents/${selectedAgent.value.id}/properties`, { method: 'POST', body: JSON.stringify(body) })
    }
    resetPropertyForm()
    await fetchProperties()
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

function editProperty(property: Property) {
  editingPropertyId.value = property.id
  Object.assign(propertyForm, {
    address: property.address, city: property.city,
    state: property.state, zipCode: property.zipCode, rentAmount: property.rentAmount,
  })
}

async function deletePropertyById(id: string) {
  if (!confirm('Delete this property and its family/tenants?')) return
  if (!selectedAgent.value) return
  try {
    await api(`${BASE}/agents/${selectedAgent.value.id}/properties/${id}`, { method: 'DELETE' })
    if (expandedPropertyId.value === id) expandedPropertyId.value = null
    await fetchProperties()
  } catch (e: any) {
    error.value = e.message
  }
}

function togglePropertyExpand(propertyId: string) {
  expandedPropertyId.value = expandedPropertyId.value === propertyId ? null : propertyId
  resetFamilyForm()
  resetTenantForm()
}

async function submitFamily(propertyId: string) {
  error.value = ''
  if (!selectedAgent.value) return
  submitting.value = true
  try {
    if (editingFamilyId.value) {
      await api(`${BASE}/agents/${selectedAgent.value.id}/properties/${propertyId}/family/${editingFamilyId.value}`, {
        method: 'PUT', body: JSON.stringify(familyForm)
      })
    } else {
      await api(`${BASE}/agents/${selectedAgent.value.id}/properties/${propertyId}/family`, {
        method: 'POST', body: JSON.stringify(familyForm)
      })
    }
    resetFamilyForm()
    await fetchProperties()
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

function editFamily(family: Family) {
  editingFamilyId.value = family.id
  familyPropertyId.value = family.propertyId
  Object.assign(familyForm, { familyName: family.familyName, moveInDate: family.moveInDate.split('T')[0] })
}

async function deleteFamilyById(propertyId: string, familyId: string) {
  if (!confirm('Delete this family and all tenants?')) return
  if (!selectedAgent.value) return
  try {
    await api(`${BASE}/agents/${selectedAgent.value.id}/properties/${propertyId}/family/${familyId}`, { method: 'DELETE' })
    await fetchProperties()
  } catch (e: any) {
    error.value = e.message
  }
}

async function submitTenant(propertyId: string, familyId: string) {
  error.value = ''
  if (!selectedAgent.value) return
  submitting.value = true
  try {
    if (editingTenantId.value) {
      await api(`${BASE}/agents/${selectedAgent.value.id}/properties/${propertyId}/family/${familyId}/tenants/${editingTenantId.value}`, {
        method: 'PUT', body: JSON.stringify(tenantForm)
      })
    } else {
      await api(`${BASE}/agents/${selectedAgent.value.id}/properties/${propertyId}/family/${familyId}/tenants`, {
        method: 'POST', body: JSON.stringify(tenantForm)
      })
    }
    resetTenantForm()
    await fetchProperties()
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

function editTenant(tenant: Tenant) {
  editingTenantId.value = tenant.id
  tenantFamilyId.value = tenant.familyId
  Object.assign(tenantForm, {
    firstName: tenant.firstName, lastName: tenant.lastName,
    email: tenant.email, phoneNumber: tenant.phoneNumber, isPrimary: tenant.isPrimary,
  })
}

async function deleteTenantById(propertyId: string, familyId: string, tenantId: string) {
  if (!confirm('Delete this tenant?')) return
  if (!selectedAgent.value) return
  try {
    await api(`${BASE}/agents/${selectedAgent.value.id}/properties/${propertyId}/family/${familyId}/tenants/${tenantId}`, { method: 'DELETE' })
    await fetchProperties()
  } catch (e: any) {
    error.value = e.message
  }
}

async function submitNote() {
  error.value = ''
  if (!selectedAgent.value) return
  submitting.value = true
  try {
    const body = { title: noteForm.title, content: noteForm.content, propertyId: noteForm.propertyId || null }
    if (editingNoteId.value) {
      await api(`${BASE}/agents/${selectedAgent.value.id}/notes/${editingNoteId.value}`, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await api(`${BASE}/agents/${selectedAgent.value.id}/notes`, { method: 'POST', body: JSON.stringify(body) })
    }
    resetNoteForm()
    await fetchNotes()
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

function editNote(note: Note) {
  editingNoteId.value = note.id
  Object.assign(noteForm, { title: note.title, content: note.content, propertyId: note.propertyId || '' })
}

async function deleteNoteById(id: string) {
  if (!confirm('Delete this note?')) return
  if (!selectedAgent.value) return
  try {
    await api(`${BASE}/agents/${selectedAgent.value.id}/notes/${id}`, { method: 'DELETE' })
    await fetchNotes()
  } catch (e: any) {
    error.value = e.message
  }
}

async function submitReminder() {
  error.value = ''
  if (!selectedAgent.value) return
  submitting.value = true
  try {
    const body = { ...reminderForm, propertyId: reminderForm.propertyId || null }
    if (editingReminderId.value) {
      await api(`${BASE}/agents/${selectedAgent.value.id}/reminders/${editingReminderId.value}`, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await api(`${BASE}/agents/${selectedAgent.value.id}/reminders`, { method: 'POST', body: JSON.stringify(body) })
    }
    resetReminderForm()
    await fetchReminders()
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

function editReminder(reminder: Reminder) {
  editingReminderId.value = reminder.id
  Object.assign(reminderForm, {
    title: reminder.title, description: reminder.description,
    dueDate: reminder.dueDate.split('T')[0] || reminder.dueDate,
    propertyId: reminder.propertyId || '',
  })
}

async function deleteReminderById(id: string) {
  if (!confirm('Delete this reminder?')) return
  if (!selectedAgent.value) return
  try {
    await api(`${BASE}/agents/${selectedAgent.value.id}/reminders/${id}`, { method: 'DELETE' })
    await fetchReminders()
  } catch (e: any) {
    error.value = e.message
  }
}

async function toggleReminderComplete(reminder: Reminder) {
  if (!selectedAgent.value) return
  try {
    await api(`${BASE}/agents/${selectedAgent.value.id}/reminders/${reminder.id}`, {
      method: 'PUT', body: JSON.stringify({ isCompleted: !reminder.isCompleted })
    })
    await fetchReminders()
  } catch (e: any) {
    error.value = e.message
  }
}

function getPropertyAddress(propertyId: string | null): string {
  if (!propertyId) return 'General'
  return properties.value.find(p => p.id === propertyId)?.address ?? 'Unknown property'
}

const overdueReminders = computed(() => reminders.value.filter(isOverdue))

onMounted(fetchAgents)
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header-inner">
        <h1 class="logo" role="button" tabindex="0" @click="goBack" @keydown.enter="goBack">
          PropertyPro
        </h1>
        <nav v-if="selectedAgent" class="breadcrumb">
          <span class="breadcrumb-link" role="link" tabindex="0" @click="goBack" @keydown.enter="goBack">Agents</span>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">{{ selectedAgent.firstName }} {{ selectedAgent.lastName }}</span>
        </nav>
      </div>
    </header>

    <div v-if="error" class="error-banner" role="alert" @click="error = ''">
      {{ error }}
      <span class="error-dismiss">&times;</span>
    </div>

    <main v-if="currentView === 'agents'" class="container">
      <div class="page-header">
        <h2>Property Agents</h2>
      </div>

      <section class="card">
        <h3>{{ editingAgentId ? 'Update Agent' : 'New Agent' }}</h3>
        <form @submit.prevent="submitAgent" class="form">
          <div class="form-grid-2">
            <div class="field">
              <label>First Name</label>
              <input v-model="agentForm.firstName" required placeholder="Jane" />
            </div>
            <div class="field">
              <label>Last Name</label>
              <input v-model="agentForm.lastName" required placeholder="Smith" />
            </div>
            <div class="field">
              <label>Email</label>
              <input v-model="agentForm.email" type="email" required placeholder="jane@example.com" />
            </div>
            <div class="field">
              <label>Mobile Number</label>
              <input v-model="agentForm.mobileNumber" required placeholder="555-123-4567" />
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="submitting">{{ editingAgentId ? 'Update' : 'Create' }}</button>
            <button v-if="editingAgentId" type="button" class="btn btn-ghost" @click="resetAgentForm">Cancel</button>
          </div>
        </form>
      </section>

      <section class="card">
        <h3>All Agents</h3>
        <p v-if="loading" class="empty-state">Loading...</p>
        <p v-else-if="agents.length === 0" class="empty-state">No agents yet. Create one above.</p>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Created</th>
                <th class="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="agent in agents" :key="agent.id" class="clickable-row" tabindex="0" @click="selectAgent(agent)" @keydown.enter="selectAgent(agent)">
                <td class="cell-name">{{ agent.firstName }} {{ agent.lastName }}</td>
                <td>{{ agent.email }}</td>
                <td>{{ agent.mobileNumber }}</td>
                <td>{{ formatDate(agent.createdAt) }}</td>
                <td class="cell-actions" @click.stop>
                  <button class="btn btn-sm btn-outline" @click="editAgent(agent)">Edit</button>
                  <button class="btn btn-sm btn-danger" @click="deleteAgentById(agent.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <main v-else-if="currentView === 'agent-detail' && selectedAgent" class="container">
      <section class="agent-summary">
        <div class="agent-info">
          <div class="agent-avatar">{{ selectedAgent.firstName[0] }}{{ selectedAgent.lastName[0] }}</div>
          <div>
            <h2>{{ selectedAgent.firstName }} {{ selectedAgent.lastName }}</h2>
            <p class="agent-meta">{{ selectedAgent.email }} &middot; {{ selectedAgent.mobileNumber }}</p>
          </div>
        </div>
        <div class="agent-stats">
          <div class="stat">
            <span class="stat-num">{{ properties.length }}</span>
            <span class="stat-label">Properties</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ notes.length }}</span>
            <span class="stat-label">Notes</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ reminders.length }}</span>
            <span class="stat-label">Reminders</span>
          </div>
          <div v-if="overdueReminders.length > 0" class="stat stat-warn">
            <span class="stat-num">{{ overdueReminders.length }}</span>
            <span class="stat-label">Overdue</span>
          </div>
        </div>
      </section>

      <div class="tabs">
        <button :class="['tab', { active: activeTab === 'properties' }]" @click="activeTab = 'properties'">Properties</button>
        <button :class="['tab', { active: activeTab === 'notes' }]" @click="activeTab = 'notes'">Notes</button>
        <button :class="['tab', { active: activeTab === 'reminders' }]" @click="activeTab = 'reminders'">Reminders</button>
      </div>

      <div v-if="activeTab === 'properties'">
        <section class="card">
          <h3>{{ editingPropertyId ? 'Update Property' : 'Add Property' }}</h3>
          <form @submit.prevent="submitProperty" class="form">
            <div class="form-grid-2">
              <div class="field field-full">
                <label>Address</label>
                <input v-model="propertyForm.address" required placeholder="123 Main St" />
              </div>
              <div class="field">
                <label>City</label>
                <input v-model="propertyForm.city" required placeholder="Springfield" />
              </div>
              <div class="field">
                <label>State</label>
                <input v-model="propertyForm.state" required placeholder="IL" />
              </div>
              <div class="field">
                <label>Zip Code</label>
                <input v-model="propertyForm.zipCode" required placeholder="62704" />
              </div>
              <div class="field">
                <label>Rent Amount ($)</label>
                <input v-model.number="propertyForm.rentAmount" type="number" min="0" step="0.01" required />
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="submitting">{{ editingPropertyId ? 'Update' : 'Add Property' }}</button>
              <button v-if="editingPropertyId" type="button" class="btn btn-ghost" @click="resetPropertyForm">Cancel</button>
            </div>
          </form>
        </section>

        <p v-if="properties.length === 0" class="empty-state">No properties yet.</p>
        <div v-for="prop in properties" :key="prop.id" class="card property-card">
          <div class="property-header" role="button" tabindex="0" @click="togglePropertyExpand(prop.id)" @keydown.enter="togglePropertyExpand(prop.id)">
            <div class="property-info">
              <h4>{{ prop.address }}</h4>
              <p class="property-meta">{{ prop.city }}, {{ prop.state }} {{ prop.zipCode }}</p>
            </div>
            <div class="property-rent">{{ formatCurrency(prop.rentAmount) }}<span class="rent-period">/mo</span></div>
            <div class="property-actions" @click.stop>
              <button class="btn btn-sm btn-outline" @click="editProperty(prop)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="deletePropertyById(prop.id)">Delete</button>
            </div>
            <span class="expand-icon">{{ expandedPropertyId === prop.id ? '&#9650;' : '&#9660;' }}</span>
          </div>

          <template v-if="expandedPropertyId === prop.id">
            <div class="property-detail">
              <div class="subsection">
                <h5>Family</h5>
                <template v-if="familyMap[prop.id]">
                  <div class="family-card">
                    <div class="family-info">
                      <strong>{{ familyMap[prop.id]!.familyName }}</strong>
                      <span class="badge">Moved in {{ formatDate(familyMap[prop.id]!.moveInDate) }}</span>
                    </div>
                    <div class="family-actions">
                      <button class="btn btn-sm btn-outline" @click="editFamily(familyMap[prop.id]!)">Edit</button>
                      <button class="btn btn-sm btn-danger" @click="deleteFamilyById(prop.id, familyMap[prop.id]!.id)">Remove</button>
                    </div>
                  </div>
                </template>
                <p v-else class="muted">No family assigned.</p>

                <form
                  v-if="!familyMap[prop.id] || (editingFamilyId && familyPropertyId === prop.id)"
                  @submit.prevent="submitFamily(prop.id)"
                  class="inline-form"
                >
                  <div class="form-grid-2">
                    <div class="field">
                      <label>Family Name</label>
                      <input v-model="familyForm.familyName" required placeholder="The Smiths" />
                    </div>
                    <div class="field">
                      <label>Move-in Date</label>
                      <input v-model="familyForm.moveInDate" type="date" required />
                    </div>
                  </div>
                  <div class="form-actions">
                    <button type="submit" class="btn btn-sm btn-primary" :disabled="submitting">{{ editingFamilyId ? 'Update' : 'Assign Family' }}</button>
                    <button v-if="editingFamilyId" type="button" class="btn btn-sm btn-ghost" @click="resetFamilyForm">Cancel</button>
                  </div>
                </form>
              </div>

              <template v-if="familyMap[prop.id]">
                <div class="subsection">
                  <h5>Tenants</h5>
                  <div v-if="tenantsMap[familyMap[prop.id]!.id]?.length" class="tenant-list">
                    <div v-for="tenant in tenantsMap[familyMap[prop.id]!.id]" :key="tenant.id" class="tenant-row">
                      <div class="tenant-info">
                        <span class="tenant-name">
                          {{ tenant.firstName }} {{ tenant.lastName }}
                          <span v-if="tenant.isPrimary" class="badge badge-primary">Primary</span>
                        </span>
                        <span class="tenant-meta">{{ tenant.email }} &middot; {{ tenant.phoneNumber }}</span>
                      </div>
                      <div class="tenant-actions">
                        <button class="btn btn-sm btn-outline" @click="editTenant(tenant)">Edit</button>
                        <button class="btn btn-sm btn-danger" @click="deleteTenantById(prop.id, familyMap[prop.id]!.id, tenant.id)">Remove</button>
                      </div>
                    </div>
                  </div>
                  <p v-else class="muted">No tenants added yet.</p>

                  <form
                    v-if="!editingTenantId || tenantFamilyId === familyMap[prop.id]!.id"
                    @submit.prevent="submitTenant(prop.id, familyMap[prop.id]!.id)"
                    class="inline-form"
                  >
                    <h6>{{ editingTenantId ? 'Update Tenant' : 'Add Tenant' }}</h6>
                    <div class="form-grid-2">
                      <div class="field">
                        <label>First Name</label>
                        <input v-model="tenantForm.firstName" required placeholder="John" />
                      </div>
                      <div class="field">
                        <label>Last Name</label>
                        <input v-model="tenantForm.lastName" required placeholder="Smith" />
                      </div>
                      <div class="field">
                        <label>Email</label>
                        <input v-model="tenantForm.email" type="email" required placeholder="john@example.com" />
                      </div>
                      <div class="field">
                        <label>Phone</label>
                        <input v-model="tenantForm.phoneNumber" required placeholder="555-000-1234" />
                      </div>
                    </div>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="tenantForm.isPrimary" />
                      Primary contact
                    </label>
                    <div class="form-actions">
                      <button type="submit" class="btn btn-sm btn-primary" :disabled="submitting">{{ editingTenantId ? 'Update' : 'Add Tenant' }}</button>
                      <button v-if="editingTenantId" type="button" class="btn btn-sm btn-ghost" @click="resetTenantForm">Cancel</button>
                    </div>
                  </form>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>

      <div v-if="activeTab === 'notes'">
        <section class="card">
          <h3>{{ editingNoteId ? 'Update Note' : 'New Note' }}</h3>
          <form @submit.prevent="submitNote" class="form">
            <div class="form-grid-2">
              <div class="field field-full">
                <label>Title</label>
                <input v-model="noteForm.title" required placeholder="Maintenance check" />
              </div>
              <div class="field field-full">
                <label>Content</label>
                <textarea v-model="noteForm.content" required rows="3" placeholder="Details about this note..."></textarea>
              </div>
              <div class="field">
                <label>Property (optional)</label>
                <select v-model="noteForm.propertyId">
                  <option value="">General (no property)</option>
                  <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.address }}</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="submitting">{{ editingNoteId ? 'Update' : 'Create Note' }}</button>
              <button v-if="editingNoteId" type="button" class="btn btn-ghost" @click="resetNoteForm">Cancel</button>
            </div>
          </form>
        </section>

        <p v-if="notes.length === 0" class="empty-state">No notes yet.</p>
        <div v-for="note in notes" :key="note.id" class="card note-card">
          <div class="note-header">
            <h4>{{ note.title }}</h4>
            <span class="badge">{{ getPropertyAddress(note.propertyId) }}</span>
          </div>
          <p class="note-content">{{ note.content }}</p>
          <div class="card-footer">
            <span class="timestamp">{{ formatDateTime(note.createdAt) }}</span>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="editNote(note)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="deleteNoteById(note.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'reminders'">
        <section class="card">
          <h3>{{ editingReminderId ? 'Update Reminder' : 'New Reminder' }}</h3>
          <form @submit.prevent="submitReminder" class="form">
            <div class="form-grid-2">
              <div class="field">
                <label>Title</label>
                <input v-model="reminderForm.title" required placeholder="Schedule pest control" />
              </div>
              <div class="field">
                <label>Due Date</label>
                <input v-model="reminderForm.dueDate" type="date" required />
              </div>
              <div class="field field-full">
                <label>Description</label>
                <textarea v-model="reminderForm.description" required rows="2" placeholder="Details..."></textarea>
              </div>
              <div class="field">
                <label>Property (optional)</label>
                <select v-model="reminderForm.propertyId">
                  <option value="">General (no property)</option>
                  <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.address }}</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="submitting">{{ editingReminderId ? 'Update' : 'Create Reminder' }}</button>
              <button v-if="editingReminderId" type="button" class="btn btn-ghost" @click="resetReminderForm">Cancel</button>
            </div>
          </form>
        </section>

        <p v-if="reminders.length === 0" class="empty-state">No reminders yet.</p>
        <div v-for="reminder in reminders" :key="reminder.id"
          :class="['card', 'reminder-card', { 'reminder-completed': reminder.isCompleted, 'reminder-overdue': isOverdue(reminder) }]">
          <div class="reminder-header">
            <label class="checkbox-label reminder-check" @click.stop>
              <input type="checkbox" :checked="reminder.isCompleted" @change="toggleReminderComplete(reminder)" />
              <h4 :class="{ 'line-through': reminder.isCompleted }">{{ reminder.title }}</h4>
            </label>
            <div class="reminder-badges">
              <span class="badge">{{ getPropertyAddress(reminder.propertyId) }}</span>
              <span :class="['badge', { 'badge-danger': isOverdue(reminder), 'badge-success': reminder.isCompleted }]">
                {{ reminder.isCompleted ? 'Done' : formatDate(reminder.dueDate) }}
              </span>
            </div>
          </div>
          <p class="note-content">{{ reminder.description }}</p>
          <div class="card-footer">
            <span class="timestamp">Created {{ formatDateTime(reminder.createdAt) }}</span>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="editReminder(reminder)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="deleteReminderById(reminder.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
:root {
  --c-bg: #f1f5f9;
  --c-bg-card: #fff;
  --c-bg-hover: #f8fafc;
  --c-bg-header: #0f172a;
  --c-text: #1e293b;
  --c-text-secondary: #475569;
  --c-text-muted: #64748b;
  --c-text-faint: #94a3b8;
  --c-border: #e2e8f0;
  --c-border-input: #cbd5e1;
  --c-primary: #2563eb;
  --c-primary-hover: #1d4ed8;
  --c-primary-light: #dbeafe;
  --c-danger: #ef4444;
  --c-danger-hover: #dc2626;
  --c-danger-light: #fef2f2;
  --c-danger-border: #fecaca;
  --c-danger-text: #b91c1c;
  --c-success: #16a34a;
  --c-success-light: #dcfce7;
  --c-warn: #f97316;
  --c-warn-light: #fb923c;
  --c-green: #059669;
  --c-link: #60a5fa;
  --c-breadcrumb: #e2e8f0;
  --radius: 6px;
  --radius-lg: 10px;
}

* { box-sizing: border-box; }

.app {
  min-height: 100vh;
  background: var(--c-bg);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: var(--c-text);
}

.header {
  background: var(--c-bg-header);
  color: #fff;
  padding: 0 1.5rem;
  height: 56px;
  display: flex;
  align-items: center;
}
.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.logo {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.025em;
  cursor: pointer;
}
.breadcrumb {
  font-size: 0.875rem;
  color: var(--c-text-faint);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.breadcrumb-link {
  cursor: pointer;
  color: var(--c-link);
}
.breadcrumb-link:hover { text-decoration: underline; }
.breadcrumb-sep { color: var(--c-text-secondary); }
.breadcrumb-current { color: var(--c-breadcrumb); }

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem;
}

.error-banner {
  background: var(--c-danger-light);
  color: var(--c-danger-text);
  border-bottom: 1px solid var(--c-danger-border);
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.error-dismiss { font-weight: 600; opacity: 0.6; }

.page-header { margin-bottom: 1.5rem; }
.page-header h2 { font-size: 1.5rem; font-weight: 700; margin: 0; }

.card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
}
.card h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--c-text-secondary);
}

.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; }
.field-full { grid-column: 1 / -1; }
.field label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--c-text-muted);
}
.field input, .field textarea, .field select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--c-border-input);
  border-radius: var(--radius);
  font-size: 0.875rem;
  background: var(--c-bg-card);
  color: var(--c-text);
  transition: border-color 0.15s;
}
.field input:focus, .field textarea:focus, .field select:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.form-actions { margin-top: 0.75rem; display: flex; gap: 0.5rem; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--c-primary); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--c-primary-hover); }
.btn-danger { background: var(--c-danger); color: #fff; }
.btn-danger:hover { background: var(--c-danger-hover); }
.btn-outline { background: var(--c-bg-card); color: var(--c-text-secondary); border: 1px solid var(--c-border-input); }
.btn-outline:hover { background: var(--c-bg-hover); border-color: var(--c-text-faint); }
.btn-ghost { background: transparent; color: var(--c-text-muted); }
.btn-ghost:hover { color: var(--c-text-secondary); background: var(--c-bg); }
.btn-sm { font-size: 0.75rem; padding: 0.3rem 0.65rem; }

.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td {
  text-align: left;
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--c-border);
  font-size: 0.875rem;
}
th {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--c-text-muted);
  background: var(--c-bg-hover);
}
.cell-name { font-weight: 600; }
.cell-actions, .th-actions { text-align: right; }
.cell-actions { display: flex; gap: 0.375rem; justify-content: flex-end; }
.clickable-row { cursor: pointer; transition: background 0.1s; }
.clickable-row:hover { background: var(--c-bg-hover); }

.agent-summary {
  background: linear-gradient(135deg, #1e3a5f 0%, var(--c-bg-header) 100%);
  color: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.agent-info { display: flex; align-items: center; gap: 1rem; }
.agent-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.agent-info h2 { margin: 0; font-size: 1.25rem; }
.agent-meta { color: var(--c-text-faint); font-size: 0.875rem; margin: 0.25rem 0 0 0; }
.agent-stats { display: flex; gap: 1.25rem; }
.stat { text-align: center; }
.stat-num { display: block; font-size: 1.5rem; font-weight: 700; }
.stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-text-faint); }
.stat-warn .stat-num { color: var(--c-warn); }
.stat-warn .stat-label { color: var(--c-warn-light); }

.tabs { display: flex; border-bottom: 2px solid var(--c-border); margin-bottom: 1.25rem; }
.tab {
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.15s;
}
.tab:hover { color: var(--c-text-secondary); }
.tab.active { color: var(--c-primary); border-bottom-color: var(--c-primary); font-weight: 600; }

.property-card { padding: 0; overflow: hidden; }
.property-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background 0.1s;
}
.property-header:hover { background: var(--c-bg-hover); }
.property-info { flex: 1; }
.property-info h4 { margin: 0; font-size: 0.95rem; font-weight: 600; }
.property-meta { margin: 0.125rem 0 0 0; font-size: 0.8rem; color: var(--c-text-muted); }
.property-rent { font-size: 1.1rem; font-weight: 700; color: var(--c-green); white-space: nowrap; }
.rent-period { font-size: 0.75rem; font-weight: 400; color: var(--c-text-muted); }
.property-actions { display: flex; gap: 0.375rem; }
.expand-icon { font-size: 0.7rem; color: var(--c-text-faint); }

.property-detail { border-top: 1px solid var(--c-border); padding: 1.25rem; background: var(--c-bg-hover); }
.subsection { margin-bottom: 1.25rem; }
.subsection:last-child { margin-bottom: 0; }
.subsection h5 {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--c-text-secondary);
  margin: 0 0 0.5rem 0;
}

.family-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  margin-bottom: 0.75rem;
}
.family-info { display: flex; align-items: center; gap: 0.75rem; }
.family-actions { display: flex; gap: 0.375rem; }

.inline-form {
  background: var(--c-bg-card);
  border: 1px dashed var(--c-border-input);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
}
.inline-form h6 { font-size: 0.8rem; font-weight: 600; margin: 0 0 0.5rem 0; color: var(--c-text-secondary); }

.tenant-list { margin-bottom: 0.75rem; }
.tenant-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  margin-bottom: 0.375rem;
}
.tenant-name { font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
.tenant-meta { font-size: 0.75rem; color: var(--c-text-muted); display: block; }
.tenant-actions { display: flex; gap: 0.375rem; }

.badge {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: var(--c-border);
  color: var(--c-text-secondary);
  white-space: nowrap;
}
.badge-primary { background: var(--c-primary-light); color: var(--c-primary-hover); }
.badge-danger { background: var(--c-danger-light); color: var(--c-danger-hover); }
.badge-success { background: var(--c-success-light); color: var(--c-success); }

.note-card { transition: border-color 0.15s; }
.note-card:hover { border-color: var(--c-border-input); }
.note-header { display: flex; justify-content: space-between; align-items: start; gap: 0.75rem; margin-bottom: 0.5rem; }
.note-header h4 { margin: 0; font-size: 0.95rem; }
.note-content { font-size: 0.875rem; color: var(--c-text-secondary); margin: 0 0 0.75rem 0; white-space: pre-wrap; }
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--c-bg);
  padding-top: 0.5rem;
}
.timestamp { font-size: 0.75rem; color: var(--c-text-faint); }
.card-actions { display: flex; gap: 0.375rem; }

.reminder-card { transition: all 0.15s; }
.reminder-completed { opacity: 0.6; }
.reminder-overdue { border-color: var(--c-danger-border); background: var(--c-danger-light); }
.reminder-header { display: flex; justify-content: space-between; align-items: start; gap: 0.75rem; margin-bottom: 0.5rem; }
.reminder-check { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.reminder-check input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--c-primary); }
.reminder-check h4 { margin: 0; font-size: 0.95rem; }
.line-through { text-decoration: line-through; color: var(--c-text-faint); }
.reminder-badges { display: flex; gap: 0.375rem; flex-shrink: 0; }

.checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; margin: 0.5rem 0; }
.checkbox-label input[type="checkbox"] { accent-color: var(--c-primary); }

.empty-state { text-align: center; color: var(--c-text-faint); padding: 2rem 1rem; font-size: 0.875rem; }
.muted { font-size: 0.8rem; color: var(--c-text-faint); margin: 0; }

@media (max-width: 640px) {
  .form-grid-2 { grid-template-columns: 1fr; }
  .agent-summary { flex-direction: column; align-items: flex-start; }
  .property-header { flex-wrap: wrap; }
}
</style>
