const express = require("express");
const router = express.Router();
const workTypeController = require("../controllers/worktype.controllers");

router.get("/", workTypeController.getWorkTypes);
router.get("/:id", workTypeController.getWorkType);
router.post("/", workTypeController.createWorkType);
router.put("/:id", workTypeController.updateWorkType);
router.post("/:id/associations", workTypeController.addAssociation);
router.put("/:id/associations/:assocId", workTypeController.updateAssociation);
router.delete(
  "/:id/associations/:assocId",
  workTypeController.deleteAssociation
);
router.put(
  "/:id/associations/:assocId/toggle-display",
  workTypeController.toggleAssociationDisplay
);

module.exports = router;
