const express = require("express");
const { upload } = require("../middleware/upload");
const {
  uploadSiteDocument,
  getSiteDocuments,
  deleteSiteDocument,
} = require("../controllers/siteDocument.controller");

const { createFolder, getFolders,deleteFolder,renameFolder } = require("../controllers/siteFolder.controller");

const router = express.Router();

router.post(
  "/sites/:siteId/documents",
  upload.single("file"),
  uploadSiteDocument
);

router.get("/sites/:siteId/documents", getSiteDocuments);

router.delete("/documents/:id", deleteSiteDocument);

router.post("/sites/:siteId/folders", createFolder);
router.get("/sites/:siteId/folders", getFolders);
router.delete(
  "/sites/:siteId/folders/:folderId",
  deleteFolder
);
router.put(
  "/sites/:siteId/folders/:folderId",
  renameFolder
);

module.exports = router;
