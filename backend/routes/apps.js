const router = require('express').Router();
const App    = require('../models/App');
const auth   = require('../middleware/auth');
const admin  = require('../middleware/admin');

// GET all apps — public
router.get('/', async (_req, res) => {
  try {
    const apps = await App.findAll({ order: [['createdAt', 'ASC']] });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create (admin)
router.post('/', auth, admin, async (req, res) => {
  try {
    const { id, name, desc, icon, fileId, fileName, link, price, category, paymentInfo } = req.body;
    const app = await App.create({
      id: id || Date.now().toString(),
      name, desc, icon, fileId, fileName, link,
      price: parseInt(price) || 0,
      category: category || 'other',
      paymentInfo,
    });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update (admin)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const app = await App.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found' });
    const { name, desc, icon, fileId, fileName, link, price, category, paymentInfo } = req.body;
    await app.update({ name, desc, icon, fileId, fileName, link,
      price: parseInt(price) || 0, category, paymentInfo });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE (admin)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const app = await App.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found' });
    await app.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
