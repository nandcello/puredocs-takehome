import { Router, Request, Response } from "express";
import {
  getFamilyByProperty,
  getFamilyById,
  createFamily,
  updateFamily,
  deleteFamily,
  familyExistsForProperty,
  getPropertyById,
} from "./store";
import { validateCreateFamily, validateUpdateFamily } from "./validation";

const router = Router({ mergeParams: true });

function verifyPropertyOwnership(req: Request, res: Response): boolean {
  const property = getPropertyById(req.params.propertyId);
  if (!property || property.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Property not found" });
    return false;
  }
  return true;
}

router.get("/", (req: Request, res: Response) => {
  if (!verifyPropertyOwnership(req, res)) return;
  const family = getFamilyByProperty(req.params.propertyId);
  if (!family) {
    res.status(404).json({ error: "No family assigned to this property" });
    return;
  }
  res.json(family);
});

router.post("/", (req: Request, res: Response) => {
  if (!verifyPropertyOwnership(req, res)) return;
  if (familyExistsForProperty(req.params.propertyId)) {
    res.status(409).json({ error: "A family already exists for this property" });
    return;
  }
  const dto = validateCreateFamily(req, res);
  if (!dto) return;

  const family = createFamily(req.params.propertyId, dto);
  res.status(201).json(family);
});

router.put("/:id", (req: Request, res: Response) => {
  if (!verifyPropertyOwnership(req, res)) return;
  const family = getFamilyById(req.params.id);
  if (!family || family.propertyId !== req.params.propertyId) {
    res.status(404).json({ error: "Family not found" });
    return;
  }
  const dto = validateUpdateFamily(req, res);
  if (!dto) return;

  const updated = updateFamily(req.params.id, dto);
  res.json(updated);
});

router.delete("/:id", (req: Request, res: Response) => {
  if (!verifyPropertyOwnership(req, res)) return;
  const family = getFamilyById(req.params.id);
  if (!family || family.propertyId !== req.params.propertyId) {
    res.status(404).json({ error: "Family not found" });
    return;
  }
  deleteFamily(req.params.id);
  res.status(204).send();
});

export default router;
