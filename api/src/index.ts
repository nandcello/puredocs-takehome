import express from "express";
import cors from "cors";
import agentRoutes from "./routes";
import propertyRoutes from "./propertyRoutes";
import familyRoutes from "./familyRoutes";
import tenantRoutes from "./tenantRoutes";
import noteRoutes from "./noteRoutes";
import reminderRoutes from "./reminderRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/agents", agentRoutes);
app.use("/api/agents/:agentId/properties", propertyRoutes);
app.use("/api/agents/:agentId/properties/:propertyId/family", familyRoutes);
app.use(
  "/api/agents/:agentId/properties/:propertyId/family/:familyId/tenants",
  tenantRoutes
);
app.use("/api/agents/:agentId/notes", noteRoutes);
app.use("/api/agents/:agentId/reminders", reminderRoutes);

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
