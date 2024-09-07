const User = require("../models/User");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
exports.register = async (req, res) => {
  try {
    const { name, email, password, profile_pic } = req.body;

    const isEmailExist = await User.findOne({ email: email });

    if (isEmailExist) {
      return res.status(400).json({
        message: "Email already exists",
        error: true,
      });
    }
    const hashedPassword = await bcryptjs.hashSync(password, 12);

    const user = new User({
      name,
      email,
      profile_pic,
      password: hashedPassword,
    });

    await user.save();

    return res.status(201).json({
      message: "User created successfully",
      data: user,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email }).select("-password");

    if (!user) {
      return res.status(400).json({
        message: "user not found",
        error: true,
      });
    }

    return res.status(200).json({
      message: "Email verified successfully",
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
    });
  }
};

exports.verifyPassword = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const user = await User.findById(userId);

    const checkPassword = await bcryptjs.compareSync(password, user.password);

    if (!checkPassword) {
      return res.status(400).json({
        message: "Invalid credentials",
        error: true,
      });
    }

    const payload = {
      id: user._id,
      email: user.email,
    };

    const token = await jwt.sign(payload, process.env.JWT_SECREAT_KEY, {
      expiresIn: "2d",
    });

    const cookieOptions = {
      http: true,
      secure: true,
    };

    return res.cookie("token", token, cookieOptions).status(200).json({
      message: "Login successfully",
      success: true,
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
    });
  }
};

exports.userDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    return res.status(200).json({
      message: "user found successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const cookieOptions = {
      http: true,
      secure: true,
    };

    return res.cookie("token", "", cookieOptions).status(200).json({
      message: "logged out",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, profile_pic } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        profile_pic,
      },
      {
        new: true,
      }
    );

    return res.status(200).json({
      message: "user updated successfully",
      data: updatedUser,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
    });
  }
};

exports.searchUser = async (req, res) => {
  try {
    const { search } = req.body;

    const query = new RegExp(search, "i", "g");

    const users = await User.find({
      $or: [{ name: query, email: query }],
    }).select("-password");

    return res.status(200).json({
      message: "all users",
      data: users,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
    });
  }
};
