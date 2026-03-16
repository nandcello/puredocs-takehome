import { Router, Request, Response } from "express";
import {
  getPropertiesByAgent,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getAgentById,
} from "./store";
import { validateCreateProperty, validateUpdateProperty } from "./validation";

const router = Router({ mergeParams: true });

router.get("/", (req: Request, res: Response) => {
  const agent = getAgentById(req.params.agentId);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json(getPropertiesByAgent(req.params.agentId));
});

router.get("/:id", (req: Request, res: Response) => {
  const property = getPropertyById(req.params.id);
  if (!property || property.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Property not found" });
    return;
  }
  res.json(property);
});

router.post("/", (req: Request, res: Response) => {
  const agent = getAgentById(req.params.agentId);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  const dto = validateCreateProperty(req, res);
  if (!dto) return;

  const property = createProperty(req.params.agentId, dto);
  res.status(201).json(property);
});

router.put("/:id", (req: Request, res: Response) => {
  const property = getPropertyById(req.params.id);
  if (!property || property.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Property not found" });
    return;
  }
  const dto = validateUpdateProperty(req, res);
  if (!dto) return;

  const updated = updateProperty(req.params.id, dto);
  res.json(updated);
});

router.delete("/:id", (req: Request, res: Response) => {
  const property = getPropertyById(req.params.id);
  if (!property || property.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Property not found" });
    return;
  }
  deleteProperty(req.params.id);
  res.status(204).send();
});

export default router;
