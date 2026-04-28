const router  = require('express').Router();
const Payment = require('../models/Payment');
const auth    = require('../middleware/auth');
const admin   = require('../middleware/admin');

// GET all (admin)
router.get('/', auth, admin, async (_req, res) => {
  try {
    const payments = await Payment.findAll({ order: [['createdAt', 'DESC']] });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET approved app IDs for current user
router.get('/approved', auth, async (req, res) => {
  try {
    const rows = await Payment.findAll({
      where: { userId: String(req.user.id), status: 'approved' },
      attributes: ['appId'],
    });
    res.json(rows.map(r => r.appId));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET my payments (status check)
router.get('/my', auth, async (req, res) => {
  try {
    const rows = await Payment.findAll({
      where: { userId: String(req.user.id) },
      attributes: ['appId', 'status'],
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST submit payment (auth)
router.post('/', auth, async (req, res) => {
  try {
    const { appId, appName, amount, receipt } = req.body;
    const p = await Payment.create({
      id:        Date.now().toString(),
      userId:    String(req.user.id),
      userName:  req.user.name,
      userEmail: req.user.email,
      appId, appName,
      amount: parseInt(amount) || 0,
      receipt,
      status: 'pending',
    });
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT approve (admin)
router.put('/:id/approve', auth, admin, async (req, res) => {
  try {
    const p = await Payment.findByPk(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    await p.update({ status: 'approved' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT deny (admin)
router.put('/:id/deny', auth, admin, async (req, res) => {
  try {
    const p = await Payment.findByPk(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    await p.update({ status: 'denied' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
