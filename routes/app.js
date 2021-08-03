const express = require('express');
const appCtrl = require('../controllers/app');
const auth = require('../middlewares/auth');
const multer = require('../middlewares/multer');
const router = express.Router();

router.get("/home", auth, appCtrl.home);
router.get("/profil", auth, appCtrl.profil);
router.post("/profil/img", auth, multer, appCtrl.img);
router.post("/profil/description", auth, appCtrl.description);
router.post("/profil/password", auth, appCtrl.password);
router.post("/profil/acccount", auth, appCtrl.account);
router.get("/notification", auth, appCtrl.notification);
router.get("/publish", auth, appCtrl.getPublish);
router.post("/publish", auth, appCtrl.publish);  
router.get("/publish/comment", auth, appCtrl.getComment);
router.post("/publish/comment", auth, appCtrl.comment);
router.get("/team", auth, appCtrl.team);

module.exports = router;