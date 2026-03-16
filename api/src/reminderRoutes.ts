import { Router, Request, Response } from "express";
import {
  getRemindersByAgent,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  getAgentById,
  getPropertyById,
} from "./store";
import { validateCreateReminder, validateUpdateReminder } from "./validation";

const router = Router({ mergeParams: true });

router.get("/", (req: Request, res: Response) => {
  const agent = getAgentById(req.params.agentId);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json(getRemindersByAgent(req.params.agentId));
});

router.get("/:id", (req: Request, res: Response) => {
  const reminder = getReminderById(req.params.id);
  if (!reminder || reminder.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  res.json(reminder);
});

router.post("/", (req: Request, res: Response) => {
  const agent = getAgentById(req.params.agentId);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  const dto = validateCreateReminder(req, res);
  if (!dto) return;

  if (dto.propertyId) {
    const property = getPropertyById(dto.propertyId);
    if (!property || property.agentId !== req.params.agentId) {
      res.status(400).json({ errors: ["propertyId does not reference a valid property for this agent"] });
      return;
    }
  }

  const reminder = createReminder(req.params.agentId, dto);
  res.status(201).json(reminder);
});

router.put("/:id", (req: Request, res: Response) => {
  const reminder = getReminderById(req.params.id);
  if (!reminder || reminder.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  const dto = validateUpdateReminder(req, res);
  if (!dto) return;

  if (dto.propertyId) {
    const property = getPropertyById(dto.propertyId);
    if (!property || property.agentId !== req.params.agentId) {
      res.status(400).json({ errors: ["propertyId does not reference a valid property for this agent"] });
      return;
    }
  }

  const updated = updateReminder(req.params.id, dto);
  res.json(updated);
});

router.delete("/:id", (req: Request, res: Response) => {
  const reminder = getReminderById(req.params.id);
  if (!reminder || reminder.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  deleteReminder(req.params.id);
  res.status(204).send();
});

export default router;
