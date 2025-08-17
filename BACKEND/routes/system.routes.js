const express = require("express");
const router = express.Router();
const systemController = require("../controllers/system.controller");

router.route("/").get(systemController.getAllSystems);
router.route("/").post(systemController.createSystem);
router.route("/:siteId").post(systemController.addSystemToSite);
router
  .route("/:siteId/:systemId")
  .delete(systemController.removeSystemFromSite);
router
  .route("/:siteId/systems/:systemId")
  .put(systemController.updateSiteSystem);

router
  .route("/:id")
  .get(systemController.getSystem)
  .patch(systemController.updateSystem);

module.exports = router;
