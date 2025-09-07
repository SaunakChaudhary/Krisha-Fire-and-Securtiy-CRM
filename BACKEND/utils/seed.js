const bcrypt = require("bcryptjs");
const AccessType = require("../models/user_type.model");
const User = require("../models/user.model");
const Permission = require("../models/permission.model");

const seedDefaults = async () => {
  try {
    // Step 1: Seed Access Types
    const accessTypesToSeed = [
      {
        name: "Super Admin",
        description: "Has all permissions and manages system-level access",
      },
      {
        name: "Engineer",
        description: "Handles assigned field tasks and job calls",
      },
    ];

    let superAdminAccessType;

    for (const item of accessTypesToSeed) {
      const existing = await AccessType.findOne({ name: item.name });
      if (!existing) {
        const createdAccessType = await AccessType.create({
          ...item,
          status: "active",
        });
        console.log(`AccessType '${item.name}' created`);
        
        // Store reference to Super Admin access type
        if (item.name === "Super Admin") {
          superAdminAccessType = createdAccessType;
        }
      } else {
        console.log(`AccessType '${item.name}' already exists`);
        // Store reference to existing Super Admin access type
        if (item.name === "Super Admin") {
          superAdminAccessType = existing;
        }
      }
    }

    // Step 2: Create Super Admin user if not exists
    let superAdminUser;
    const existingSuperAdmin = await User.findOne({
      username: process.env.SUPER_ADMIN_USERNAME,
    });

    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash(
        process.env.SUPER_ADMIN_PASSWORD,
        10
      );
      
      superAdminUser = await User.create({
        firstname: "Super",
        lastname: "Admin",
        email: "admin@krishafire.com",
        username: process.env.SUPER_ADMIN_USERNAME,
        password: hashedPassword,
        accesstype_id: superAdminAccessType._id,
        status: "active",
      });

      console.log(
        `Super Admin user created with username: ${process.env.SUPER_ADMIN_USERNAME}`
      );
    } else {
      superAdminUser = existingSuperAdmin;
      console.log("Super Admin user already exists");
    }

    // Step 3: Create permissions for Super Admin with all permissions set to true
    const existingPermission = await Permission.findOne({
      role: superAdminAccessType._id,
    });

    if (!existingPermission) {
      // Create permission object with all permissions set to true
      const allPermissions = {
        "Dashboard": true,
        "Manage User": true,
        "Manage Customer": true,
        "Manage Site": true,
        "Manage Sales Enquiry": true,
        "Manage Quotation": true,
        "Manage Job Costing": true,
        "Manage System Code": true,
        "Manage Call": true,
        "Manage Diary": true,
        "Manage Supplier": true,
        "Manage Stock": true,
        "Manage Purchase Order": true,
        "Manage Reports": true,
        "Manage Cabinet": true,
      };

      await Permission.create({
        role: superAdminAccessType._id,
        permissions: allPermissions,
        createdBy: superAdminUser._id,
        updatedBy: superAdminUser._id,
      });

      console.log("Super Admin permissions created with all access granted");
    } else {
      console.log("Super Admin permissions already exist");
    }

  } catch (error) {
    console.error("Error during seeding:", error.message);
  }
};

module.exports = { seedDefaults };