import { Router } from 'express';
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
  getLikesOfVideo,
  getLikesOfTweets,
  getLikedTweets,
  getLikedTweetsOfChannel,
  getCommentLikes,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/toggle/c/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/toggle/t/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/videos").get(verifyJWT, getLikedVideos);
router.route("/getLikes/:videoId").get(getLikesOfVideo);
router.route("/getLikes/tweets/:tweetId").get(getLikesOfTweets);
router.route("/tweets").get(verifyJWT, getLikedTweets);
router.route("/tweets/:channelId").get(verifyJWT, getLikedTweetsOfChannel);
router.route("/getLikes/comment/:commentId").get(getCommentLikes);

export default router