const router = require('express').Router();

router.use('/assignments', require('./assignments'));
router.use('/courses', require('./courses'));
router.use('/uploads', require('./uploads'));
router.use('/users', require('./users'));

module.exports = router;