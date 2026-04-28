const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// All admin routes require auth + admin role
router.use(auth, admin);

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
    res.json({ users });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await user.destroy();
    res.json({ message: "User deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/make-admin/:id
router.put("/make-admin/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({ isAdmin: true });

    const { password, ...safe } = user.toJSON();
    res.json({ message: "User promoted to admin", user: safe });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
