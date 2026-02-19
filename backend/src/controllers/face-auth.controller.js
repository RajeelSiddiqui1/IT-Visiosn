import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import multer from "multer";
import faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-wasm";
import canvas from "canvas";
import cloudinary from "../lib/cloudinary.js";

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Setup TF backend
await tf.setBackend("wasm");
await tf.ready();

// Load face models
const MODEL_PATH = path.join(process.cwd(), "model");
await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// Helper: Convert buffer to canvas image
async function bufferToCvImage(buffer) {
  return canvas.loadImage(buffer);
}

// ======================
// Add Face Endpoint
// ======================
export async function addFace(req, res) {
  try {
    const { userId } = req.body;

    // Validate input
    if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });
    if (!req.file) return res.status(400).json({ success: false, message: "No image provided" });

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Load image and detect face
    const img = await bufferToCvImage(req.file.buffer);
    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    if (!detection) return res.status(400).json({ success: false, message: "No face detected" });

    // Save locally
    const dir = path.join("faces", userId);
    await fs.mkdir(dir, { recursive: true });
    const localPath = path.join(dir, `${uuid()}.jpg`);
    await fs.writeFile(localPath, req.file.buffer);

    // Upload to Cloudinary
    const cld = await new Promise((resolve, reject) =>
      cloudinary.uploader.upload_stream(
        { folder: `faces/${userId}` },
        (err, result) => (err ? reject(err) : resolve(result))
      ).end(req.file.buffer)
    );

    // Save face data in DB
    user.faces.push({
      descriptor: Array.from(detection.descriptor),
      localPath,
      cloudinaryUrl: cld.secure_url,
      publicId: cld.public_id,
    });
    await user.save();

    res.json({ success: true, message: "Face registered successfully" });
  } catch (err) {
    console.error("Add Face Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
}

// ======================
// Login With Face Endpoint
// ======================
export async function loginWithFace(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image provided" });

    // Load image and detect face
    const img = await bufferToCvImage(req.file.buffer);
    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    if (!detection) return res.status(400).json({ success: false, message: "No face detected" });

    // Find best match
    const users = await User.find();
    let bestMatch = null;
    let minDistance = 0.6;

    for (const u of users) {
      for (const f of u.faces) {
        const dist = faceapi.euclideanDistance(detection.descriptor, new Float32Array(f.descriptor));
        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = u;
        }
      }
    }

    if (!bestMatch) return res.status(400).json({ success: false, message: "No matching face found" });

    // Check if banned
    if (bestMatch.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Your account is banned. Reason: ${bestMatch.banReason || "No reason provided"}`,
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: bestMatch._id }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });

    // Set cookie
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    const userData = await User.findById(bestMatch._id).select("-password");
    res.json({ success: true, user: userData });
  } catch (err) {
    console.error("Login With Face Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
}

export { upload };
