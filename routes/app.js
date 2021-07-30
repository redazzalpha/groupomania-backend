const express = require('express');
const router = express.Router();
const appCtrl = require('../controllers/app');
const auth = require('../middlewares/auth');

router.get("/home", auth, appCtrl.home);
router.get("/profil", auth, appCtrl.profil);
router.get("/notification", auth, appCtrl.notification);
router.get("/team", auth, appCtrl.team);
router.post("/publish", auth, appCtrl.publish);
router.get("/publish", auth, appCtrl.getPublish);

module.exports = router;