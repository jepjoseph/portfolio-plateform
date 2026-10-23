import { Router } from "express";

import { requireAuthentication } from "../middleware/authenticationMiddleware.js";

import {
  listMyProjects,
  getMyProject,
  createMyProject,
  updateMyProject,
  setMyProjectArchiveStatus,
  deleteMyProject,
} from "../controllers/projectController.js";

import { requireProjectOwnership } from "../middleware/project/projectOwnershipMiddleware.js";

import { uploadProjectMedia } from "../middleware/project/projectMediaUploadMiddleware.js";

import { validateProjectMedia } from "../middleware/project/projectMediaValidationMiddleware.js";

import {
  uploadMyProjectMedia,
  listMyProjectMedia,
  getMyProjectMedia,
  deleteMyProjectMedia,
} from "../controllers/projectMediaController.js";

const router = Router();

/*
 * All Project API endpoints require an
 * authenticated user session.
 */
router.use(requireAuthentication);

/*
 * GET /api/projects
 * POST /api/projects
 */
router.get("/", listMyProjects);
router.post("/", createMyProject);

/*
 * GET /api/projects/:projectId
 * PUT /api/projects/:projectId
 */
router.get("/:projectId", getMyProject);
router.put("/:projectId", updateMyProject);

/*
 * PATCH /api/projects/:projectId/archive
 */
router.patch("/:projectId/archive", setMyProjectArchiveStatus);

/*
 * =========================================
 * Project Media Listing
 * =========================================
 *
 * GET /api/projects/:projectId/media
 *
 * Authentication is applied globally.
 * Project ownership is verified before
 * returning media metadata.
 */

router.get("/:projectId/media", requireProjectOwnership, listMyProjectMedia);

/*
 * =========================================
 * Project Media Retrieval
 * =========================================
 */

router.get(
  "/:projectId/media/:mediaId",
  requireProjectOwnership,
  getMyProjectMedia,
);

/*
 * =========================================
 * Project Media Upload
 * =========================================
 *
 * Authentication is applied globally.
 *
 * Ownership must be verified before Multer
 * writes the uploaded file.
 */

router.post(
  "/:projectId/media",
  requireProjectOwnership,
  uploadProjectMedia,
  validateProjectMedia,
  uploadMyProjectMedia,
);

/*
 * DELETE /api/projects/:projectId
 */
router.delete("/:projectId", deleteMyProject);

router.delete(
  "/:projectId/media/:mediaId",
  requireProjectOwnership,
  deleteMyProjectMedia,
);

export default router;
