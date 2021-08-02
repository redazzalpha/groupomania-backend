const express = require('express');
const router = express.Router();
const appCtrl = require('../controllers/app');
const auth = require('../middlewares/auth');

router.get("/home", auth, appCtrl.home);
router.get("/profil", auth, appCtrl.profil);
router.get("/notification", auth, appCtrl.notification);
router.get("/team", auth, appCtrl.team);
router.get("/publish", auth, appCtrl.getPublish);
router.get("/publish/comment", auth, appCtrl.getComment);
router.post("/publish", auth, appCtrl.publish);
router.post("/publish/comment", auth, appCtrl.comment);

module.exports = router;