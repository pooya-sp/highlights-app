import { Request, Response } from "express";
import * as linkService from "../services/linkService.js";

// POST /api/v1/links
export async function createLink(req: Request, res: Response) {
  const { url, tags } = req.body ?? {};
  const link = await linkService.createLink(req.userId as string, url, tags);

  res.status(201).json({
    status: "success",
    data: { link },
  });
}

// GET /api/v1/links?page=1&limit=10
export async function getLinks(req: Request, res: Response) {
  const result = await linkService.getLinks(req.userId as string, req.query);

  res.status(200).json({
    status: "success",
    results: result.links.length,
    data: result,
  });
}

// GET /api/v1/links/:id
export async function getLink(req: Request, res: Response) {
  const link = await linkService.getLink(
    req.params.id as string,
    req.userId as string,
  );

  res.status(200).json({
    status: "success",
    data: { link },
  });
}

// DELETE /api/v1/links/:id
export async function deleteLink(req: Request, res: Response) {
  await linkService.deleteLink(req.params.id as string, req.userId as string);

  res.status(204).json({
    status: "success",
    data: null,
  });
}

// POST /api/v1/links/:id/recheck
export async function recheckLink(req: Request, res: Response) {
  const link = await linkService.recheckLink(
    req.params.id as string,
    req.userId as string,
  );

  res.status(200).json({
    status: "success",
    data: { link },
  });
}

// PATCH /api/v1/links/:id/tags
export async function updateLinkTags(req: Request, res: Response) {
  const { tags } = req.body ?? {};
  const link = await linkService.updateLinkTags(
    req.params.id as string,
    req.userId as string,
    tags,
  );

  res.status(200).json({
    status: "success",
    data: { link },
  });
}
