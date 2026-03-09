const router = require('express').Router();
const { body } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');

const authController = require('../controllers/authController');
const clientController = require('../controllers/clientController');
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const financeController = require('../controllers/financeController');
const dashboardController = require('../controllers/dashboardController');
const exportController = require('../controllers/exportController');
const fileController = require('../controllers/fileController');
const upload = require('../middleware/upload');
const { User, Notification, Task } = require('../models');
const { getAuthUrl, getTokensFromCode, createCalendarEvent } = require('../services/googleCalendar');

// ─── AUTH ─────────────────────────────────────────────
router.post('/auth/register',
  [
    body('name').notEmpty().withMessage('Имя обязательно'),
    body('email').isEmail().withMessage('Некорректный email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
  ],
  authController.register
);

router.post('/auth/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

router.get('/auth/me', auth, authController.me);
router.post('/auth/change-password', auth, authController.changePassword);

// ─── USERS ────────────────────────────────────────────
router.get('/users', auth, async (req, res) => {
  const users = await User.findAll({
    where: { isActive: true },
    attributes: ['id', 'name', 'email', 'role', 'position', 'avatar', 'employeeType'],
  });
  res.json(users);
});

router.put('/users/:id', auth, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const { password, ...data } = req.body;
  await user.update(data);
  res.json(user);
});

// Промоут текущего пользователя в admin если нет ни одного admin
router.post('/users/promote-admin', auth, async (req, res) => {
  const adminCount = await User.count({ where: { role: 'admin' } });
  if (adminCount > 0) {
    return res.status(400).json({ error: 'Admin уже существует' });
  }
  const user = await User.findByPk(req.user.id);
  await user.update({ role: 'admin' });
  res.json({ message: 'Вы стали admin', role: 'admin' });
});

router.patch('/users/:id/deactivate', auth, requireRole('admin'), async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  await user.update({ isActive: false });
  res.json({ message: 'Аккаунт деактивирован' });
});

// ─── NOTIFICATIONS ────────────────────────────────────
router.get('/notifications', auth, async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 30,
  });
  res.json(notifications);
});

router.patch('/notifications/:id/read', auth, async (req, res) => {
  await Notification.update(
    { isRead: true },
    { where: { id: req.params.id, userId: req.user.id } }
  );
  res.json({ ok: true });
});

router.patch('/notifications/read-all', auth, async (req, res) => {
  await Notification.update(
    { isRead: true },
    { where: { userId: req.user.id } }
  );
  res.json({ ok: true });
});

// ─── CLIENTS ──────────────────────────────────────────
router.get('/clients', auth, clientController.getClients);
router.get('/clients/:id', auth, clientController.getClientById);
router.post('/clients', auth, requireRole('admin', 'manager'), clientController.createClient);
router.put('/clients/:id', auth, requireRole('admin', 'manager'), clientController.updateClient);
router.patch('/clients/:id/stage', auth, clientController.updateStage);
router.delete('/clients/:id', auth, requireRole('admin'), clientController.deleteClient);
router.post('/clients/:id/interactions', auth, clientController.addInteraction);

// ─── PROJECTS ─────────────────────────────────────────
router.get('/projects', auth, projectController.getProjects);
router.get('/projects/:id', auth, projectController.getProjectById);
router.post('/projects', auth, requireRole('admin', 'manager'), projectController.createProject);
router.put('/projects/:id', auth, requireRole('admin', 'manager'), projectController.updateProject);
router.delete('/projects/:id', auth, requireRole('admin'), projectController.deleteProject);

// ─── TASKS ────────────────────────────────────────────
router.get('/tasks', auth, taskController.getTasks);
router.get('/tasks/:id', auth, taskController.getTaskById);
router.post('/tasks', auth, taskController.createTask);
router.put('/tasks/:id', auth, taskController.updateTask);
router.delete('/tasks/:id', auth, taskController.deleteTask);
router.post('/tasks/:id/timer/start', auth, taskController.startTimer);
router.post('/tasks/:id/timer/stop', auth, taskController.stopTimer);
router.post('/tasks/:id/time', auth, taskController.addTimeManually);

// ─── FINANCE ──────────────────────────────────────────
router.get('/invoices', auth, requireRole('admin', 'manager'), financeController.getInvoices);
router.post('/invoices', auth, requireRole('admin', 'manager'), financeController.createInvoice);
router.put('/invoices/:id', auth, requireRole('admin', 'manager'), financeController.updateInvoice);
router.post('/invoices/:id/payment', auth, requireRole('admin', 'manager'), financeController.recordPayment);

router.get('/expenses', auth, requireRole('admin', 'manager'), financeController.getExpenses);
router.post('/expenses', auth, requireRole('admin', 'manager'), financeController.createExpense);

router.get('/reports/finance', auth, requireRole('admin', 'manager'), financeController.getReport);

// ─── DASHBOARD ────────────────────────────────────────
router.get('/dashboard', auth, dashboardController.getDashboard);

// ─── EXPORT ──────────────────────────────────────────
router.get('/export/clients', auth, requireRole('admin', 'manager'), exportController.exportClientsExcel);
router.get('/export/invoices/:id/pdf', auth, requireRole('admin', 'manager'), exportController.exportInvoicePdf);
router.get('/export/reports/excel', auth, requireRole('admin', 'manager'), exportController.exportReportExcel);
router.get('/export/reports/pdf', auth, requireRole('admin', 'manager'), exportController.exportReportPdf);

// ─── FILES ───────────────────────────────────────────
router.post('/files/:entity/:entityId', auth, upload.array('files', 10), fileController.uploadFiles);
router.delete('/files/:entity/:filename', auth, fileController.deleteFile);

// ─── GOOGLE CALENDAR ─────────────────────────────────
// Получить ссылку для авторизации Google Calendar
router.get('/google/auth', auth, (req, res) => {
  const url = getAuthUrl(req.user.id);
  if (!url) {
    return res.status(400).json({ error: 'Google Calendar не настроен. Добавьте GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET в .env' });
  }
  res.json({ url });
});

// Callback после авторизации Google
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code || !userId) {
      return res.status(400).send('Ошибка авторизации');
    }

    const tokens = await getTokensFromCode(code);
    if (!tokens?.refresh_token) {
      return res.status(400).send('Не удалось получить refresh token');
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).send('Пользователь не найден');

    await user.update({ googleRefreshToken: tokens.refresh_token });

    // Редирект обратно в CRM
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/team?google=connected`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.status(500).send('Ошибка авторизации Google');
  }
});

// Отвязать Google Calendar
router.delete('/google/disconnect', auth, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  await user.update({ googleRefreshToken: null });
  res.json({ message: 'Google Calendar отключён' });
});

// Синхронизировать задачу с Google Calendar
router.post('/tasks/:id/google-calendar', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user?.googleRefreshToken) {
      return res.status(400).json({ error: 'Google Calendar не подключён. Авторизуйтесь через настройки.' });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    if (!task.deadline) return res.status(400).json({ error: 'У задачи нет дедлайна' });

    const event = await createCalendarEvent(user.googleRefreshToken, task);
    if (event) {
      await task.update({ googleEventId: event.id });
      res.json({ message: 'Событие создано в Google Calendar', eventId: event.id });
    } else {
      res.status(500).json({ error: 'Не удалось создать событие' });
    }
  } catch (err) {
    console.error('Google Calendar sync error:', err);
    res.status(500).json({ error: 'Ошибка синхронизации с Google Calendar' });
  }
});

module.exports = router;