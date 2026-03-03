const express = require("express");
const { upload } = require("../middleware/upload");
const {
  uploadCustomerDocument,
  getCustomerDocuments,
  deleteCustomerDocument,
} = require("../controllers/customerDocument.controller");

const { createFolder, getFolders,deleteFolder,renameFolder } = require("../controllers/CustomerFolder.controller");

const router = express.Router();

router.post(
  "/customers/:customerId/documents",
  upload.single("file"),
  uploadCustomerDocument
);

router.get("/customers/:customerId/documents", getCustomerDocuments);

router.delete("/documents/:id", deleteCustomerDocument);

router.post("/customers/:customerId/folders", createFolder);
router.get("/customers/:customerId/folders", getFolders);
router.delete(
  "/customers/:customerId/folders/:folderId",
  deleteFolder
);
router.put(
  "/customers/:customerId/folders/:folderId",
  renameFolder
);

module.exports = router;
