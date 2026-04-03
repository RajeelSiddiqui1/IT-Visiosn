

// admin

import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendOtp } from "../lib/sendOtp.js";
import { generateOTP } from "../lib/generateOtp.js";
import {sendOtpEmail} from "../lib/sendOtpEmail.js"
import bcrypt from "bcrypt";
// admin

// SIGNUP
export async function signup(req, res) {
  const { email, password, fullName, role, phone } = req.body;

  try {
    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    const existingPhone = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already exists, please use a different one" });
    }
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "Phone already exists, please use a different one" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    const avatarUrl = randomAvatar;

    const newUser = await User.create({
      email,
      fullName: fullName,
      password: hashedPassword,
      phone,
      profilePic: avatarUrl,
      role: role || "user",
      isOnboarded: role === "admin" ? true : false,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullname,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullname}`);
    } catch (error) {
      console.log("Error creating Stream user:", error);
    }

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ success: true, user: newUser, token });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    // 👇 Banned user check
    if (user.isBanned) {
      return res.status(403).json({
        message: `Your account is banned. Reason: ${user.banReason || "No reason provided"}`
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, user, token });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// LOGOUT
export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout successful" });
}


export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, language, location, profilePic, skills } = req.body;

    // Validate required fields
    if (!fullName || !bio || !language || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !language && "language",
          !location && "location",
        ].filter(Boolean),
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        language,
        location,
        profilePic: profilePic || "", // fallback to empty string
        skills: Array.isArray(skills) ? skills : [], // ensure array
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    // Optional: update Stream user for chat/video integration
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(
        `Stream user updated after onboarding for ${updatedUser.fullName}`
      );
    } catch (streamError) {
      console.log(
        "Error updating Stream user during onboarding:",
        streamError.message
      );
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
// UPDATE PROFILE
export async function updateProfile(req, res) {
  const userId = req.user.id;

  try {
    const {
      fullName,
      email,
      bio,
      profilePic,
      language,
      location,
      dateOfBirth,
      phone,
      skills,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(bio && { bio }),
        ...(profilePic !== "" && { profilePic }),
        ...(language && { language }),
        ...(location && { location }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(phone && { phone }),
        ...(skills && { skills }),
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

// SEND OTP

export const sendOTP = async (req, res) => {
  const { phone, email } = req.body;

  try {
    const user = await User.findOne({ $or: [{ phone }, { email }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    if (email) {
      await sendOtpEmail(email, otp);
    } else if (phone) {
      await sendOTP(phone,otp)
    }

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // DB me user check karo
    const user = await User.findOne({ email });

    if (!user) {
      // User nahi mila
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Agar fullname missing hai, fallback assign kar do
    if (!user.fullName) user.fullName = "User";

    // OTP generate karo
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    // Save changes
    await user.save();

    // Email bhejo
    await sendOtpEmail(user.email, otp, user.fullName);

    return res.status(200).json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    return res.status(500).json({
      message: "Failed to resend OTP",
      error: err.message,
    });
  }
};


export const verifyOTPHandler = async (req, res) => {
  const { phone, email, otp } = req.body;

  try {
    const user = await User.findOne({ $or: [{ phone }, { email }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ message: 'OTP verified. You may now reset your password.' });
  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { phone, email, newPassword } = req.body;

  try {
    const user = await User.findOne({ $or: [{ phone }, { email }] });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword; // <-- plain password, pre-save will hash it
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Password change failed", error: err.message });
  }
};
