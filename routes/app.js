const express = require('express');
const multer = require('../middlewares/multer');
const router = express.Router();
const appCtrl = require('../controllers/app');
const auth = require('../middlewares/auth');

router.get("/home", auth, appCtrl.accessHome);
router.get("/profil", auth, appCtrl.accessProfil);
router.get("/notification", auth, appCtrl.accessNotif);
router.get("/team", auth, appCtrl.accessTeam);
router.get("/publish", auth, appCtrl.getPubs);
router.get("/publish/comment", auth, appCtrl.getComment);
router.get("/notification/notifs", auth, appCtrl.getNotif);
router.get("/team/users", auth, appCtrl.getUsers);
router.get("/autolog", auth, appCtrl.autoLog);

router.post("/publish", auth, appCtrl.publish);  
router.post("/publish/comment", auth, appCtrl.comment);
router.post("/publish/like", auth, appCtrl.like);
router.post("/publish/dislike", auth, appCtrl.dislike);
router.post("/publish/unlike", auth, appCtrl.unlike);
router.post("/publish/undislike", auth, appCtrl.undislike);
router.post("/profil/img", auth, multer, appCtrl.uptProfImg);
router.post("/img", auth, multer, appCtrl.uploadImg);

router.patch("/profil/description/:desc", auth, appCtrl.uptProfDesc);
router.patch("/password/:old&:new", auth, appCtrl.uptProfPasswd);
router.patch("/notification/read/:notifId", auth, appCtrl.readNotif);

router.delete("/publish/delete/:pubId", auth, appCtrl.delPublication);
router.delete("/publish/comment/delete/:comId", auth, appCtrl.delComment);
router.delete("/notification/delete/:notifId", auth, appCtrl.delNotif);
router.delete("/profil/:id", auth, appCtrl.delProfil);


module.exports = router;