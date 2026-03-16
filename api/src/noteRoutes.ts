import { Router, Request, Response } from "express";
import {
  getNotesByAgent,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getAgentById,
  getPropertyById,
} from "./store";
import { validateCreateNote, validateUpdateNote } from "./validation";

const router = Router({ mergeParams: true });

router.get("/", (req: Request, res: Response) => {
  const agent = getAgentById(req.params.agentId);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json(getNotesByAgent(req.params.agentId));
});

router.get("/:id", (req: Request, res: Response) => {
  const note = getNoteById(req.params.id);
  if (!note || note.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json(note);
});

router.post("/", (req: Request, res: Response) => {
  const agent = getAgentById(req.params.agentId);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  const dto = validateCreateNote(req, res);
  if (!dto) return;

  if (dto.propertyId) {
    const property = getPropertyById(dto.propertyId);
    if (!property || property.agentId !== req.params.agentId) {
      res.status(400).json({ errors: ["propertyId does not reference a valid property for this agent"] });
      return;
    }
  }

  const note = createNote(req.params.agentId, dto);
  res.status(201).json(note);
});

router.put("/:id", (req: Request, res: Response) => {
  const note = getNoteById(req.params.id);
  if (!note || note.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  const dto = validateUpdateNote(req, res);
  if (!dto) return;

  if (dto.propertyId) {
    const property = getPropertyById(dto.propertyId);
    if (!property || property.agentId !== req.params.agentId) {
      res.status(400).json({ errors: ["propertyId does not reference a valid property for this agent"] });
      return;
    }
  }

  const updated = updateNote(req.params.id, dto);
  res.json(updated);
});

router.delete("/:id", (req: Request, res: Response) => {
  const note = getNoteById(req.params.id);
  if (!note || note.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  deleteNote(req.params.id);
  res.status(204).send();
});

export default router;
