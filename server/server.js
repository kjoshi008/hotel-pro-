
/**
 * HotelPro - MERN Backend
 * Express + MongoDB + JWT Authentication
 * Roles: Ordinary (Guest), Staff, Admin
 */

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

const PORT = process.env.PORT || 8001;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hotelpro";
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "hotelpro_luxury_secret_jwt_key_at_least_32_chars";

// -------------------- MIDDLEWARE --------------------

app.use(cors());
app.use(express.json());

// -------------------- DATABASE MODELS --------------------

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    userType: {
      type: String,
      enum: ["Ordinary", "Staff", "Admin"],
      default: "Ordinary",
    },
  },
  { timestamps: true }
);

const RoomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["Delux", "Non-Delux"],
      required: true,
    },
    maxCount: { type: Number, default: 2 },
    rentPerDay: { type: Number, required: true },
    photos: { type: [String], default: [] },
    description: { type: String, default: "" },
    avgRating: { type: Number, default: 4.9 },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
  },
  { timestamps: true }
);

const BookingSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true },
    type: { type: String, required: true },
    guestName: { type: String, required: true },
    userEmail: { type: String, required: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    totalDays: { type: Number, default: 1 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "booked",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
      ],
      default: "booked",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
const Room = mongoose.model("Room", RoomSchema);
const Booking = mongoose.model("Booking", BookingSchema);

// -------------------- INITIAL DATA --------------------

async function seedInitialData() {
  // Add demo rooms only when no rooms exist.
  if ((await Room.countDocuments()) === 0) {
    await Room.insertMany([
      {
        roomNumber: "101",
        type: "Non-Delux",
        maxCount: 2,
        rentPerDay: 1800,
        avgRating: 4.8,
        photos: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
        ],
        description: "Queen suite with marble bath and city views.",
      },
      {
        roomNumber: "102",
        type: "Non-Delux",
        maxCount: 3,
        rentPerDay: 2600,
        avgRating: 4.9,
        photos: [
          "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
        ],
        description: "Dual queen suite with rainfall shower.",
      },
      {
        roomNumber: "201",
        type: "Delux",
        maxCount: 2,
        rentPerDay: 4200,
        avgRating: 5.0,
        photos: [
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        ],
        description: "King deluxe suite with a panoramic terrace.",
      },
      {
        roomNumber: "202",
        type: "Delux",
        maxCount: 4,
        rentPerDay: 5800,
        avgRating: 4.9,
        photos: [
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
        ],
        description: "Grand suite with two king beds.",
      },
    ]);

    console.log("Demo rooms added.");
  }

  // Create demo users individually so existing accounts are preserved.
  const demoUsers = [
    {
      name: "HotelPro Admin",
      email: "admin@hotelpro.com",
      password: "admin123",
      userType: "Admin",
    },
    {
      name: "Demo Guest",
      email: "guest@hotelpro.com",
      password: "guest123",
      userType: "Ordinary",
    },
    {
      name: "HotelPro Staff",
      email: "staff@hotelpro.com",
      password: "staff123",
      userType: "Staff",
    },
  ];

  for (const demo of demoUsers) {
    const existing = await User.findOne({ email: demo.email });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(demo.password, 10);

      await User.create({
        name: demo.name,
        email: demo.email,
        password: hashedPassword,
        userType: demo.userType,
      });

      console.log(`Demo ${demo.userType} account created.`);
    }
  }
}

// -------------------- AUTHENTICATION MIDDLEWARE --------------------

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  if (!token) {
    return res.status(401).json({ msg: "Please log in first." });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      msg: "Invalid or expired login session. Please log in again.",
    });
  }
}

function requireStaffOrAdmin(req, res, next) {
  if (!["Staff", "Admin"].includes(req.auth?.role)) {
    return res.status(403).json({
      msg: "Only Staff or Admin can manage bookings.",
    });
  }

  next();
}

// -------------------- HEALTH CHECK --------------------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "HotelPro API" });
});

// -------------------- ROOMS --------------------

app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    res.json({ rooms, total: rooms.length });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// -------------------- SIGNUP --------------------

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        msg: "Name, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        msg: "Password must contain at least 6 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({
        msg: "This email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Public signup always creates a Guest account.
    // Staff/Admin accounts must be created by an administrator.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || "",
      userType: "Ordinary",
    });

    res.status(201).json({
      msg: "Registration successful. You can now log in.",
      userId: user._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        msg: "This email is already registered.",
      });
    }

    res.status(500).json({ msg: error.message });
  }
});

// -------------------- LOGIN --------------------

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        msg: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.userType,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// -------------------- CREATE BOOKING --------------------

app.post("/api/bookings", requireAuth, async (req, res) => {
  try {
    const {
      roomNumber,
      type,
      guestName,
      fromDate,
      toDate,
      totalDays,
      totalAmount,
    } = req.body;

    if (
      !roomNumber ||
      !type ||
      !fromDate ||
      !toDate ||
      !totalAmount
    ) {
      return res.status(400).json({
        msg: "Required booking details are missing.",
      });

    }

    // Use the logged-in account's identity, not client-supplied identity.
    const user = await User.findById(req.auth.id);

    if (!user) {
      return res.status(401).json({ msg: "User account not found." });
    }

    const booking = await Booking.create({
      roomNumber,
      type,
      guestName: user.name,
      userEmail: user.email,
      fromDate,
      toDate,
      totalDays: Math.max(1, Number(totalDays) || 1),
      totalAmount: Number(totalAmount),
      status: "booked",
    });

    res.status(201).json({
      msg: "Reservation created successfully.",
      booking,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// -------------------- LIST BOOKINGS --------------------

// Staff/Admin can view all bookings.
// Guests can view only their own bookings.
app.get("/api/bookings/mine", requireAuth, async (req, res) => {
  try {
    const isStaffOrAdmin = ["Staff", "Admin"].includes(
      req.auth.role
    );

    const filter = isStaffOrAdmin
      ? {}
      : { userEmail: req.auth.email };

    // Support older tokens that may not contain the email.
    if (!isStaffOrAdmin && !req.auth.email) {
      const user = await User.findById(req.auth.id);

      if (!user) {
        return res.status(401).json({ msg: "User not found." });
      }

      filter.userEmail = user.email;
    }

    const items = await Booking.find(filter).sort({ createdAt: -1 });

    res.json({ items, total: items.length });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// -------------------- CONFIRM OR CANCEL BOOKING --------------------

app.patch(
  "/api/bookings/:id/status",
  requireAuth,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["confirmed", "cancelled"].includes(status)) {
        return res.status(400).json({
          msg: "Status must be confirmed or cancelled.",
        });
      }

      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          msg: "Invalid booking ID.",
        });
      }

      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({
          msg: "Booking not found.",
        });
      }

      if (booking.status === "cancelled") {
        return res.status(400).json({
          msg: "This booking has already been cancelled.",
        });
      }

      booking.status = status;
      await booking.save();

      res.json({
        msg: `Booking ${status} successfully.`,
        booking,
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  }
);

// -------------------- ADMIN REPORTS --------------------

app.get(
  "/api/reports/summary",
  requireAuth,
  async (req, res) => {
    try {
      if (req.auth.role !== "Admin") {
        return res.status(403).json({
          msg: "Admin access required.",
        });
      }

      const roomsCount = await Room.countDocuments();
      const bookingsCount = await Booking.countDocuments();
      const confirmedCount = await Booking.countDocuments({
        status: "confirmed",
      });

      res.json({
        totalRooms: roomsCount,
        totalBookings: bookingsCount,
        confirmedBookings: confirmedCount,
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  }
);

// -------------------- CONNECT DATABASE & START SERVER --------------------

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    await seedInitialData();

    app.listen(PORT, () => {
      console.log(`HotelPro server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
