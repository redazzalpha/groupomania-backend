const express = require('express');
const multer = require('../middlewares/multer');
const router = express.Router();
const appCtrl = require('../controllers/app');
const auth = require('../middlewares/auth');

router.head("/home", auth, appCtrl.accessHome);
router.head("/profil", auth, appCtrl.accessProfil);
router.head("/notification", auth, appCtrl.accessNotif);
router.head("/team", auth, appCtrl.accessTeam);
router.head("/autolog", auth, appCtrl.autoLog);

router.get("/publish?:limit", auth, appCtrl.getPubs);
router.get("/publish/user", auth, appCtrl.getUserPubs);
router.get("/publish/comment", auth, appCtrl.getComment);
router.get("/publish/scroll?:lpubid", auth, appCtrl.pubScroll);
router.get("/publish/user/scroll?:lpubid", auth, appCtrl.userPubScroll);
router.get("/publish/count", auth, appCtrl.pubsCount);
router.get("/publish/user/count", auth, appCtrl.userPubsCount);
router.get("/notification/notifs", auth, appCtrl.getNotif);
router.get("/team/users", auth, appCtrl.getUsers);

router.post("/publish", auth, appCtrl.publish);  
router.post("/publish/comment", auth, appCtrl.comment);
router.post("/publish/like", auth, appCtrl.like);
router.post("/publish/dislike", auth, appCtrl.dislike);
router.post("/publish/unlike", auth, appCtrl.unlike);
router.post("/publish/undislike", auth, appCtrl.undislike);
router.post("/profil/img", auth, multer, appCtrl.uptProfImg);
router.post("/profil/mode", auth, multer, appCtrl.profMode);
router.post("/token", appCtrl.token);

router.patch("/profil/description", auth, appCtrl.uptProfDesc);
router.patch("/password", auth, appCtrl.uptProfPasswd);
router.patch("/notification/read", auth, appCtrl.readNotif);
router.patch("/notification/readall", auth, appCtrl.readAll);
router.patch("/notification/deleteall", auth, appCtrl.deleteAll);
router.patch("/authorize/super", auth, appCtrl.superUser);
router.patch("/authorize/revoke", auth, appCtrl.revokeSuperUser);
router.patch("/profil/lock", auth, appCtrl.lockUser);
router.patch("/profil/unlock", auth, appCtrl.unlockUser);

router.delete("/publish/delete?:pubId", auth, appCtrl.delPublication);
router.delete("/publish/comment/delete?:comId", auth, appCtrl.delComment);
router.delete("/notification/delete?:notifId", auth, appCtrl.delNotif);
router.delete("/account?:id", auth, appCtrl.delAccount);


module.exports = router;