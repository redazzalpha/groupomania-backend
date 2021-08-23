const express = require('express');
const multer = require('../middlewares/multer');
const router = express.Router();
const appCtrl = require('../controllers/app');
const auth = require('../middlewares/auth');

router.get("/home", auth, appCtrl.accessHome);
router.get("/profil", auth, appCtrl.accessProfil);
router.put("/profil/img", auth, multer, appCtrl.uptProfImg);
router.put("/profil/description", auth, appCtrl.uptProfDesc);
router.put("/profil/password", auth, appCtrl.uptProfPasswd);
router.post("/profil/delete", auth, appCtrl.delAccount);
router.post("/publish", auth, appCtrl.publish);  
router.get("/publish", auth, appCtrl.getPubs);
router.post("/publish/like", auth, appCtrl.like);
router.post("/publish/dislike", auth, appCtrl.dislike);
router.post("/publish/unlike", auth, appCtrl.unlike);
router.post("/publish/undislike", auth, appCtrl.undislike);
router.post("/publish/delete", auth, appCtrl.delPublication);  
router.post("/publish/comment", auth, appCtrl.comment);
router.get("/publish/comment", auth, appCtrl.getComment);
router.post("/publish/comment/delete", auth, appCtrl.delComment);
router.get("/notification", auth, appCtrl.accessNotif);
router.get("/notification/notifs", auth, appCtrl.getNotif);
router.post("/notification/delete", auth, appCtrl.delNotif);
router.post("/notification/read", auth, appCtrl.readNotif);
router.get("/team", auth, appCtrl.accessTeam);
router.get("/team/users", auth, appCtrl.getUsers);
router.get("/autolog", auth, appCtrl.autoLog);
router.patch("/password/:old&:new", auth, appCtrl.modifyPassword);
router.delete("/profil/:id", auth, appCtrl.deleteProf);
router.post("/img", auth, multer, appCtrl.insertImg);


module.exports = router;