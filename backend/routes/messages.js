const router  = require('express').Router();
const Message = require('../models/Message');
const auth    = require('../middleware/auth');
const admin   = require('../middleware/admin');

// GET all (admin)
router.get('/', auth, admin, async (_req, res) => {
  try {
    const messages = await Message.findAll({ order: [['createdAt', 'DESC']] });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new message (public)
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    const m = await Message.create({
      id: Date.now().toString(),
      name, phone, email, message, status: 'unread',
    });
    res.status(201).json(m);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT mark as read (admin)
router.put('/:id/read', auth, admin, async (req, res) => {
  try {
    const m = await Message.findByPk(req.params.id);
    if (!m) return res.status(404).json({ message: 'Not found' });
    await m.update({ status: 'read' });
    res.json(m);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
