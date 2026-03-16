# Property Agent API

REST API for managing Property Agents (CRUD). Data is stored in memory.

## Setup

```bash
cd api
bun install
bun run dev
```

Server runs at `http://localhost:3000`.

## Endpoints

| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| GET    | /api/agents          | List all agents    |
| GET    | /api/agents/:id      | Get single agent   |
| POST   | /api/agents          | Create an agent    |
| PUT    | /api/agents/:id      | Update an agent    |
| DELETE | /api/agents/:id      | Delete an agent    |

## curl Examples

### Create an Agent (POST)

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@realty.com",
    "mobileNumber": "555-987-6543"
  }'
```

Response (201):
```json
{
  "id": "756430f0-be8a-48a8-9566-626211c9b32e",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@realty.com",
  "mobileNumber": "555-987-6543",
  "createdAt": "2026-03-11T11:22:06.501Z",
  "updatedAt": "2026-03-11T11:22:06.501Z"
}
```

### List All Agents (GET)

```bash
curl http://localhost:3000/api/agents
```

Response (200):
```json
[
  {
    "id": "756430f0-be8a-48a8-9566-626211c9b32e",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@realty.com",
    "mobileNumber": "555-987-6543",
    "createdAt": "2026-03-11T11:22:06.501Z",
    "updatedAt": "2026-03-11T11:22:06.501Z"
  }
]
```

### Get Single Agent (GET)

```bash
curl http://localhost:3000/api/agents/<AGENT_ID>
```

Response (200): same shape as a single object above.
Response (404): `{ "error": "Agent not found" }`

### Update an Agent (PUT)

```bash
curl -X PUT http://localhost:3000/api/agents/<AGENT_ID> \
  -H "Content-Type: application/json" \
  -d '{
    "lastName": "Johnson"
  }'
```

Response (200): returns the updated agent object with a new `updatedAt` timestamp.

### Delete an Agent (DELETE)

```bash
curl -X DELETE http://localhost:3000/api/agents/<AGENT_ID>
```

Response (204): no body on success.
Response (404): `{ "error": "Agent not found" }`

## Stretch Goal: Input Validation

The API validates all input before processing:
- **Required fields**: `firstName`, `lastName`, `email`, `mobileNumber` (on create)
- **Email format**: must match standard email pattern
- **Phone format**: must be 7-20 chars, digits/spaces/dashes/parens allowed
- **Trimming & normalization**: whitespace trimmed, email lowercased

Example validation error (400):
```json
{
  "errors": ["A valid email is required", "A valid mobileNumber is required"]
}
```
