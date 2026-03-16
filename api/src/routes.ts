import { Router, Request, Response } from "express";
import {
  getAllAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
} from "./store";
import { validateCreateAgent, validateUpdateAgent } from "./validation";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json(getAllAgents());
});

router.get("/:id", (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json(agent);
});

router.post("/", (req: Request, res: Response) => {
  const dto = validateCreateAgent(req, res);
  if (!dto) return;

  res.status(201).json(createAgent(dto));
});

router.put("/:id", (req: Request, res: Response) => {
  if (!getAgentById(req.params.id)) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  const dto = validateUpdateAgent(req, res);
  if (!dto) return;

  res.json(updateAgent(req.params.id, dto));
});

router.delete("/:id", (req: Request, res: Response) => {
  if (!deleteAgent(req.params.id)) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.status(204).send();
});

export default router;
