import { Router, Request, Response } from "express";
import {
  getTenantsByFamily,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getFamilyById,
  getPropertyById,
} from "./store";
import { validateCreateTenant, validateUpdateTenant } from "./validation";

const router = Router({ mergeParams: true });

function verifyFamilyChain(req: Request, res: Response): boolean {
  const property = getPropertyById(req.params.propertyId);
  if (!property || property.agentId !== req.params.agentId) {
    res.status(404).json({ error: "Property not found" });
    return false;
  }
  const family = getFamilyById(req.params.familyId);
  if (!family || family.propertyId !== req.params.propertyId) {
    res.status(404).json({ error: "Family not found" });
    return false;
  }
  return true;
}

router.get("/", (req: Request, res: Response) => {
  if (!verifyFamilyChain(req, res)) return;
  res.json(getTenantsByFamily(req.params.familyId));
});

router.get("/:id", (req: Request, res: Response) => {
  if (!verifyFamilyChain(req, res)) return;
  const tenant = getTenantById(req.params.id);
  if (!tenant || tenant.familyId !== req.params.familyId) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.json(tenant);
});

router.post("/", (req: Request, res: Response) => {
  if (!verifyFamilyChain(req, res)) return;
  const dto = validateCreateTenant(req, res);
  if (!dto) return;

  const tenant = createTenant(req.params.familyId, dto);
  res.status(201).json(tenant);
});

router.put("/:id", (req: Request, res: Response) => {
  if (!verifyFamilyChain(req, res)) return;
  const tenant = getTenantById(req.params.id);
  if (!tenant || tenant.familyId !== req.params.familyId) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  const dto = validateUpdateTenant(req, res);
  if (!dto) return;

  const updated = updateTenant(req.params.id, dto);
  res.json(updated);
});

router.delete("/:id", (req: Request, res: Response) => {
  if (!verifyFamilyChain(req, res)) return;
  const tenant = getTenantById(req.params.id);
  if (!tenant || tenant.familyId !== req.params.familyId) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  deleteTenant(req.params.id);
  res.status(204).send();
});

export default router;
