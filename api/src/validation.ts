import { Request, Response } from "express";
import {
  CreatePropertyAgentDto,
  UpdatePropertyAgentDto,
  CreatePropertyDto,
  UpdatePropertyDto,
  CreateFamilyDto,
  UpdateFamilyDto,
  CreateTenantDto,
  UpdateTenantDto,
  CreateNoteDto,
  UpdateNoteDto,
  CreateReminderDto,
  UpdateReminderDto,
} from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

export function validateCreateAgent(
  req: Request,
  res: Response
): CreatePropertyAgentDto | null {
  const { firstName, lastName, email, mobileNumber } = req.body;
  const errors: string[] = [];

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    errors.push("firstName is required");
  }
  if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
    errors.push("lastName is required");
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    errors.push("A valid email is required");
  }
  if (
    !mobileNumber ||
    typeof mobileNumber !== "string" ||
    !PHONE_REGEX.test(mobileNumber)
  ) {
    errors.push("A valid mobileNumber is required");
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    mobileNumber: mobileNumber.trim(),
  };
}

export function validateUpdateAgent(
  req: Request,
  res: Response
): UpdatePropertyAgentDto | null {
  const { firstName, lastName, email, mobileNumber } = req.body;
  const errors: string[] = [];
  const dto: UpdatePropertyAgentDto = {};

  if (firstName !== undefined) {
    if (typeof firstName !== "string" || !firstName.trim()) {
      errors.push("firstName must be a non-empty string");
    } else {
      dto.firstName = firstName.trim();
    }
  }
  if (lastName !== undefined) {
    if (typeof lastName !== "string" || !lastName.trim()) {
      errors.push("lastName must be a non-empty string");
    } else {
      dto.lastName = lastName.trim();
    }
  }
  if (email !== undefined) {
    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      errors.push("A valid email is required");
    } else {
      dto.email = email.trim().toLowerCase();
    }
  }
  if (mobileNumber !== undefined) {
    if (typeof mobileNumber !== "string" || !PHONE_REGEX.test(mobileNumber)) {
      errors.push("A valid mobileNumber is required");
    } else {
      dto.mobileNumber = mobileNumber.trim();
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  if (Object.keys(dto).length === 0) {
    res.status(400).json({ errors: ["No valid fields provided for update"] });
    return null;
  }

  return dto;
}

export function validateCreateProperty(
  req: Request,
  res: Response
): CreatePropertyDto | null {
  const { address, city, state, zipCode, rentAmount } = req.body;
  const errors: string[] = [];

  if (!address || typeof address !== "string" || !address.trim()) {
    errors.push("address is required");
  }
  if (!city || typeof city !== "string" || !city.trim()) {
    errors.push("city is required");
  }
  if (!state || typeof state !== "string" || !state.trim()) {
    errors.push("state is required");
  }
  if (!zipCode || typeof zipCode !== "string" || !ZIP_REGEX.test(zipCode)) {
    errors.push("A valid zipCode is required (e.g. 12345 or 12345-6789)");
  }
  if (rentAmount === undefined || typeof rentAmount !== "number" || rentAmount < 0) {
    errors.push("rentAmount must be a non-negative number");
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  return {
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    zipCode: zipCode.trim(),
    rentAmount,
  };
}

export function validateUpdateProperty(
  req: Request,
  res: Response
): UpdatePropertyDto | null {
  const { address, city, state, zipCode, rentAmount } = req.body;
  const errors: string[] = [];
  const dto: UpdatePropertyDto = {};

  if (address !== undefined) {
    if (typeof address !== "string" || !address.trim()) {
      errors.push("address must be a non-empty string");
    } else {
      dto.address = address.trim();
    }
  }
  if (city !== undefined) {
    if (typeof city !== "string" || !city.trim()) {
      errors.push("city must be a non-empty string");
    } else {
      dto.city = city.trim();
    }
  }
  if (state !== undefined) {
    if (typeof state !== "string" || !state.trim()) {
      errors.push("state must be a non-empty string");
    } else {
      dto.state = state.trim();
    }
  }
  if (zipCode !== undefined) {
    if (typeof zipCode !== "string" || !ZIP_REGEX.test(zipCode)) {
      errors.push("A valid zipCode is required");
    } else {
      dto.zipCode = zipCode.trim();
    }
  }
  if (rentAmount !== undefined) {
    if (typeof rentAmount !== "number" || rentAmount < 0) {
      errors.push("rentAmount must be a non-negative number");
    } else {
      dto.rentAmount = rentAmount;
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  if (Object.keys(dto).length === 0) {
    res.status(400).json({ errors: ["No valid fields provided for update"] });
    return null;
  }

  return dto;
}

export function validateCreateFamily(
  req: Request,
  res: Response
): CreateFamilyDto | null {
  const { familyName, moveInDate } = req.body;
  const errors: string[] = [];

  if (!familyName || typeof familyName !== "string" || !familyName.trim()) {
    errors.push("familyName is required");
  }
  if (!moveInDate || typeof moveInDate !== "string" || isNaN(Date.parse(moveInDate))) {
    errors.push("A valid moveInDate is required (ISO date string)");
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  return {
    familyName: familyName.trim(),
    moveInDate,
  };
}

export function validateUpdateFamily(
  req: Request,
  res: Response
): UpdateFamilyDto | null {
  const { familyName, moveInDate } = req.body;
  const errors: string[] = [];
  const dto: UpdateFamilyDto = {};

  if (familyName !== undefined) {
    if (typeof familyName !== "string" || !familyName.trim()) {
      errors.push("familyName must be a non-empty string");
    } else {
      dto.familyName = familyName.trim();
    }
  }
  if (moveInDate !== undefined) {
    if (typeof moveInDate !== "string" || isNaN(Date.parse(moveInDate))) {
      errors.push("A valid moveInDate is required");
    } else {
      dto.moveInDate = moveInDate;
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  if (Object.keys(dto).length === 0) {
    res.status(400).json({ errors: ["No valid fields provided for update"] });
    return null;
  }

  return dto;
}

export function validateCreateTenant(
  req: Request,
  res: Response
): CreateTenantDto | null {
  const { firstName, lastName, email, phoneNumber, isPrimary } = req.body;
  const errors: string[] = [];

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    errors.push("firstName is required");
  }
  if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
    errors.push("lastName is required");
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    errors.push("A valid email is required");
  }
  if (
    !phoneNumber ||
    typeof phoneNumber !== "string" ||
    !PHONE_REGEX.test(phoneNumber)
  ) {
    errors.push("A valid phoneNumber is required");
  }
  if (typeof isPrimary !== "boolean") {
    errors.push("isPrimary must be a boolean");
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    phoneNumber: phoneNumber.trim(),
    isPrimary,
  };
}

export function validateUpdateTenant(
  req: Request,
  res: Response
): UpdateTenantDto | null {
  const { firstName, lastName, email, phoneNumber, isPrimary } = req.body;
  const errors: string[] = [];
  const dto: UpdateTenantDto = {};

  if (firstName !== undefined) {
    if (typeof firstName !== "string" || !firstName.trim()) {
      errors.push("firstName must be a non-empty string");
    } else {
      dto.firstName = firstName.trim();
    }
  }
  if (lastName !== undefined) {
    if (typeof lastName !== "string" || !lastName.trim()) {
      errors.push("lastName must be a non-empty string");
    } else {
      dto.lastName = lastName.trim();
    }
  }
  if (email !== undefined) {
    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      errors.push("A valid email is required");
    } else {
      dto.email = email.trim().toLowerCase();
    }
  }
  if (phoneNumber !== undefined) {
    if (typeof phoneNumber !== "string" || !PHONE_REGEX.test(phoneNumber)) {
      errors.push("A valid phoneNumber is required");
    } else {
      dto.phoneNumber = phoneNumber.trim();
    }
  }
  if (isPrimary !== undefined) {
    if (typeof isPrimary !== "boolean") {
      errors.push("isPrimary must be a boolean");
    } else {
      dto.isPrimary = isPrimary;
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  if (Object.keys(dto).length === 0) {
    res.status(400).json({ errors: ["No valid fields provided for update"] });
    return null;
  }

  return dto;
}

export function validateCreateNote(
  req: Request,
  res: Response
): CreateNoteDto | null {
  const { propertyId, title, content } = req.body;
  const errors: string[] = [];

  if (!title || typeof title !== "string" || !title.trim()) {
    errors.push("title is required");
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    errors.push("content is required");
  }
  if (propertyId !== undefined && propertyId !== null && typeof propertyId !== "string") {
    errors.push("propertyId must be a string or null");
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  return {
    propertyId: propertyId || null,
    title: title.trim(),
    content: content.trim(),
  };
}

export function validateUpdateNote(
  req: Request,
  res: Response
): UpdateNoteDto | null {
  const { propertyId, title, content } = req.body;
  const errors: string[] = [];
  const dto: UpdateNoteDto = {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      errors.push("title must be a non-empty string");
    } else {
      dto.title = title.trim();
    }
  }
  if (content !== undefined) {
    if (typeof content !== "string" || !content.trim()) {
      errors.push("content must be a non-empty string");
    } else {
      dto.content = content.trim();
    }
  }
  if (propertyId !== undefined) {
    if (propertyId !== null && typeof propertyId !== "string") {
      errors.push("propertyId must be a string or null");
    } else {
      dto.propertyId = propertyId || null;
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  if (Object.keys(dto).length === 0) {
    res.status(400).json({ errors: ["No valid fields provided for update"] });
    return null;
  }

  return dto;
}

export function validateCreateReminder(
  req: Request,
  res: Response
): CreateReminderDto | null {
  const { propertyId, title, description, dueDate } = req.body;
  const errors: string[] = [];

  if (!title || typeof title !== "string" || !title.trim()) {
    errors.push("title is required");
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    errors.push("description is required");
  }
  if (!dueDate || typeof dueDate !== "string" || isNaN(Date.parse(dueDate))) {
    errors.push("A valid dueDate is required (ISO date string)");
  }

  if (propertyId !== undefined && propertyId !== null && typeof propertyId !== "string") {
    errors.push("propertyId must be a string or null");
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  return {
    propertyId: propertyId || null,
    title: title.trim(),
    description: description.trim(),
    dueDate,
  };
}

export function validateUpdateReminder(
  req: Request,
  res: Response
): UpdateReminderDto | null {
  const { propertyId, title, description, dueDate, isCompleted } = req.body;
  const errors: string[] = [];
  const dto: UpdateReminderDto = {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      errors.push("title must be a non-empty string");
    } else {
      dto.title = title.trim();
    }
  }
  if (description !== undefined) {
    if (typeof description !== "string" || !description.trim()) {
      errors.push("description must be a non-empty string");
    } else {
      dto.description = description.trim();
    }
  }
  if (dueDate !== undefined) {
    if (typeof dueDate !== "string" || isNaN(Date.parse(dueDate))) {
      errors.push("A valid dueDate is required");
    } else {
      dto.dueDate = dueDate;
    }
  }
  if (isCompleted !== undefined) {
    if (typeof isCompleted !== "boolean") {
      errors.push("isCompleted must be a boolean");
    } else {
      dto.isCompleted = isCompleted;
    }
  }
  if (propertyId !== undefined) {
    if (propertyId !== null && typeof propertyId !== "string") {
      errors.push("propertyId must be a string or null");
    } else {
      dto.propertyId = propertyId || null;
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return null;
  }

  if (Object.keys(dto).length === 0) {
    res.status(400).json({ errors: ["No valid fields provided for update"] });
    return null;
  }

  return dto;
}
