const bcrypt = require("bcryptjs");
const AccessType = require("../models/user_type.model"); // adjust path as needed
const User = require("../models/user.model");

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

    for (const item of accessTypesToSeed) {
      const existing = await AccessType.findOne({ name: item.name });
      if (!existing) {
        await AccessType.create({
          ...item,
          status: "active",
        });
        console.log(`AccessType '${item.name}' created`);
      }
    }

    // Step 2: Create Super Admin user if not exists
    const superAdminAccessType = await AccessType.findOne({
      name: "Super Admin",
    });
    const existingSuperAdmin = await User.findOne({ username: process.env.SUPER_ADMIN_USERNAME });

    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10); // 🔐 Use env in production
      await User.create({
        firstname: "Super",
        lastname: "Admin",
        email: "admin@krishafire.com",
        username: process.env.SUPER_ADMIN_USERNAME,
        password: hashedPassword,
        accesstype_id: superAdminAccessType._id,
        status: "active",
      });
      console.log(
        "Super Admin user created with username: superadmin and password: SuperAdmin@123"
      );
    } else {
      console.log("Super Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error during seeding:", error.message);
  }
};

module.exports = seedDefaults;
