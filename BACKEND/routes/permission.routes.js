const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permission.controller");

// Create
router.post("/", permissionController.createPermission);

// Read all
router.get("/", permissionController.getAllPermissions);

// Read one (by role)
router.get("/:roleId", permissionController.getPermissionByRole);

// Update
router.put("/:roleId", permissionController.updatePermission);

// Delete
router.delete("/:roleId", permissionController.deletePermission);

module.exports = router;
