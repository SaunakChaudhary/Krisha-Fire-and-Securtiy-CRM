const User = require("../models/user.model");
const AccessType = require("../models/user_type.model");
const Engineer = require("../models/engineer.model");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Input validation helper
const validateUserInput = (data) => {
  const { firstname, lastname, email, username, password, accesstype_id } =
    data;
  const errors = [];

  if (!firstname || typeof firstname !== "string" || firstname.length < 2) {
    errors.push("First name is required and must be at least 2 characters");
  }
  if (!lastname || typeof lastname !== "string" || lastname.length < 2) {
    errors.push("Last name is required and must be at least 2 characters");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Valid email is required");
  }
  if (!username || typeof username !== "string" || username.length < 3) {
    errors.push("Username is required and must be at least 3 characters");
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    errors.push("Password is required and must be at least 6 characters");
  }
  if (!accesstype_id || !mongoose.Types.ObjectId.isValid(accesstype_id)) {
    errors.push("Valid access type ID is required");
  }

  return errors;
};

// Input validation helper for engineer data
const validateEngineerInput = (data) => {
  const {
    eng_code,
    skill_level,
    commission,
    current_status,
    latitude,
    longitude,
    address_line1,
    postcode,
  } = data;
  const errors = [];

  if (!eng_code || typeof eng_code !== "string" || eng_code.trim().length < 1) {
    errors.push("Engineer code is required and must be a non-empty string");
  }
  if (
    !skill_level ||
    !["beginner", "intermediate", "advanced", "expert", "Senior"].includes(
      skill_level
    )
  ) {
    errors.push(
      "Skill level is required and must be one of: beginner, intermediate, advanced, expert, Senior"
    );
  }
  if (commission && (isNaN(commission) || commission < 0)) {
    errors.push("Commission must be a non-negative number");
  }
  if (
    current_status &&
    !["available", "busy", "offline"].includes(current_status)
  ) {
    errors.push("Current status must be one of: available, busy, offline");
  }
  if (latitude && isNaN(latitude)) {
    errors.push("Latitude must be a number");
  }
  if (longitude && isNaN(longitude)) {
    errors.push("Longitude must be a number");
  }
  if (address_line1 && typeof address_line1 !== "string") {
    errors.push("Address line 1 must be a string");
  }
  if (postcode && typeof postcode !== "string") {
    errors.push("Postcode must be a string");
  }

  return errors;
};

// CREATE USER
const createUser = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      username,
      password,
      accesstype_id,
      status = "active",
      isEngineer,
      engineerData,
    } = req.body;

    // Validate input
    const validationErrors = validateUserInput({
      firstname,
      lastname,
      email,
      username,
      password,
      accesstype_id,
    });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Check for duplicate email or username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.email === email
            ? "Email already exists"
            : "Username already exists",
      });
    }

    // Check for unique engineer code if applicable
    if (isEngineer && engineerData?.eng_code) {
      const existingEngineer = await Engineer.findOne({
        eng_code: engineerData.eng_code,
      });
      if (existingEngineer) {
        return res.status(400).json({
          error: "Engineer Code (eng_code) must be unique",
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      username,
      password: hashedPassword,
      accesstype_id,
      status,
    });

    // Create engineer profile if applicable
    if (isEngineer && engineerData) {
      await Engineer.create({
        ...engineerData,
        user_id: newUser._id,
      });
    }

    res.status(201).json({
      message: "User created successfully",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// UPDATE USER
const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    firstname,
    lastname,
    email,
    username,
    accesstype_id,
    status,
    isEngineer,
    engineerData,
  } = req.body;

  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Validate input
    const validationErrors = validateUserInput({
      firstname,
      lastname,
      email,
      username,
      password: "dummyA",
      accesstype_id,
    });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Check for duplicate email or username (excluding current user)
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: id },
    });
    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.email === email
            ? "Email already exists"
            : "Username already exists",
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        firstname,
        lastname,
        email,
        username,
        accesstype_id,
        status,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Handle engineer profile
    if (isEngineer && engineerData) {
      if (engineerData?.eng_code) {
        const existingEngineer = await Engineer.findOne({
          eng_code: engineerData.eng_code,
          user_id: { $ne: id },
        });
        if (existingEngineer) {
          return res.status(400).json({
            error: "Engineer Code (eng_code) must be unique",
          });
        }
      }

      const existingEngineer = await Engineer.findOne({ user_id: id });
      if (existingEngineer) {
        await Engineer.findOneAndUpdate({ user_id: id }, engineerData, {
          new: true,
          runValidators: true,
        });
      } else {
        await Engineer.create({
          ...engineerData,
          user_id: id,
        });
      }
    } else {
      // Remove engineer profile if isEngineer is false
      await Engineer.findOneAndDelete({ user_id: id });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message || "Failed to update user" });
  }
};

// DELETE USER
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Delete user
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete associated engineer
    await Engineer.findOneAndDelete({ user_id: id });

    res.status(200).json({
      message: "User and associated engineer deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message || "Failed to delete user" });
  }
};

const getAllActiveUsers = async (req, res) => {
  try {
    const users = await User.find({
      status: "active",
    })
      .populate("accesstype_id")
      .lean();

    res.status(200).json({ users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("accesstype_id").lean();

    res.status(200).json({ users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const changePassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Validate new password
    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 6
    ) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
// UPDATE ENGINEER
const updateEngineer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      eng_code,
      skill_level,
      commission,
      current_status,
      over_time,
      latest_location_date,
      latitude,
      longitude,
      address_line1,
      address_line2,
      address_line3,
      address_line4,
      postcode,
    } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid engineer ID" });
    }

    // Validate input
    const validationErrors = validateEngineerInput({
      eng_code,
      skill_level,
      commission,
      current_status,
      latitude,
      longitude,
      address_line1,
      postcode,
    });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Check for duplicate engineer code (excluding current engineer)
    if (eng_code) {
      const existingEngineer = await Engineer.findOne({
        eng_code,
        _id: { $ne: id },
      });
      if (existingEngineer) {
        return res.status(400).json({ error: "Engineer code must be unique" });
      }
    }

    // Update engineer
    const updatedEngineer = await Engineer.findByIdAndUpdate(
      id,
      {
        eng_code,
        skill_level,
        commission: commission || 0,
        current_status: current_status || "available",
        over_time: over_time || false,
        latest_location_date: latest_location_date
          ? new Date(latest_location_date)
          : undefined,
        latitude,
        longitude,
        address_line1,
        address_line2,
        address_line3,
        address_line4,
        postcode,
      },
      { new: true, runValidators: true }
    );

    if (!updatedEngineer) {
      return res.status(404).json({ error: "Engineer not found" });
    }

    res.status(200).json({ message: "Engineer updated successfully" });
  } catch (error) {
    console.error("Update engineer error:", error);
    res.status(500).json({ error: "Failed to update engineer" });
  }
};

// GET ENGINEER BY USER ID
const getEngineerByUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Find engineer by user_id
    const engineer = await Engineer.findOne({ user_id: id }).lean();
    if (!engineer) {
      return res
        .status(404)
        .json({ error: "Engineer not found for this user" });
    }

    res.status(200).json(engineer);
  } catch (error) {
    console.error("Get engineer by user error:", error);
    res.status(500).json({ error: "Failed to fetch engineer data" });
  }
};

const getAllEngineers = async (req, res) => {
  try {
    const engineers = await Engineer.find().populate("user_id").lean();
    res.status(200).json({
      engineers: engineers.filter((eng) => eng.user_id.status === "active"),
    });
  } catch (error) {
    console.error("Get all engineers error:", error);
    res.status(500).json({ error: "Failed to fetch engineers" });
  }
};

const bulkUploadUsers = async (req, res) => {
  try {
    const usersData = req.body;

    if (!Array.isArray(usersData) || usersData.length === 0) {
      return res.status(400).json({ message: "Invalid or empty data" });
    }

    const createdUsers = [];
    const errors = [];

    for (let i = 0; i < usersData.length; i++) {
      const data = usersData[i];

      const access_type = await AccessType.findOne({
        name: data.accesstype_id,
      });

      try {
        // Create User
        const user = new User({
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          username: data.username,
          password: await bcrypt.hash(data.password, salt),
          accesstype_id: access_type._id,
          status: data.status,
        });
        
        const savedUser = await user.save();

        // If engineer fields exist, create Engineer
        if (
          data.eng_code ||
          data.skill_level ||
          data.commission !== undefined
        ) {
          const engineer = new Engineer({
            user_id: savedUser._id,
            eng_code: data.eng_code,
            commission: data.commission,
            skill_level: data.skill_level,
            over_time: data.over_time,
            address_line1: data.address_line1,
            address_line2: data.address_line2,
            address_line3: data.address_line3,
            address_line4: data.address_line4,
            postcode: data.postcode,
          });
          await engineer.save();
        }

        createdUsers.push(savedUser);
      } catch (err) {
        errors.push({
          row: i + 1,
          error: err.message,
        });
      }
    }

    if (errors.length > 0) {
      console.log({
        message: "Partial success",
        inserted: createdUsers.length,
        failed: errors.length,
        errors,
      });

      return res.status(207).json({
        message: "Partial success",
        inserted: createdUsers.length,
        failed: errors.length,
        errors,
      });
    }

    res.status(201).json({
      message: "All users uploaded successfully",
      count: createdUsers.length,
    });
    console.log("Bulk upload successful:", { count: createdUsers.length });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createUser,
  bulkUploadUsers,
  getAllEngineers,
  updateUser,
  deleteUser,
  getAllUsers,
  getAllActiveUsers,
  changePassword,
  updateEngineer,
  getEngineerByUser,
};
