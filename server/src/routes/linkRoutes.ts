import { Router } from "express";
import {
  createLink,
  getLinks,
  getLink,
  deleteLink,
  recheckLink,
  updateLinkTags,
} from "../controllers/linkController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// All link routes are protected — mount auth middleware once for the router.
router.use(protect);

router.post("/", createLink);
router.get("/", getLinks);
router.get("/:id", getLink);
router.delete("/:id", deleteLink);
router.post("/:id/recheck", recheckLink);
router.patch("/:id/tags", updateLinkTags);

export default router;
