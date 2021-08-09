const express = require('express');
const appCtrl = require('../controllers/app');
const auth = require('../middlewares/auth');
const tokenConfig = require('../middlewares/token');
const multer = require('../middlewares/multer');
const router = express.Router();

router.get("/home", auth, tokenConfig, appCtrl.accessHome);
router.get("/profil", auth, tokenConfig, appCtrl.accessProfil);
router.put("/profil/img", auth, tokenConfig, multer, appCtrl.uptProfImg);
router.put("/profil/description", auth, tokenConfig, appCtrl.uptProfDesc);
router.put("/profil/password", auth, tokenConfig, appCtrl.uptProfPasswd);
router.post("/profil/delete", auth, tokenConfig, appCtrl.delAccount);
router.post("/publish", auth, tokenConfig, appCtrl.publish);  
router.get("/publish", auth, tokenConfig, appCtrl.getPublish);
router.post("/publish/like", auth, tokenConfig, appCtrl.like);
router.post("/publish/dislike", auth, tokenConfig, appCtrl.dislike);
router.post("/publish/delete", auth, tokenConfig, appCtrl.delPublication);  
router.post("/publish/comment", auth, tokenConfig, appCtrl.comment);
router.get("/publish/comment", auth, tokenConfig, appCtrl.getComment);
router.post("/publish/comment/delete", auth, tokenConfig, appCtrl.delComment);
router.get("/notification", auth, tokenConfig, appCtrl.accessNotif);
router.get("/team", auth, tokenConfig, appCtrl.accessTeam);
router.get("/autolog", auth, tokenConfig, appCtrl.autoLog);

module.exports = router;