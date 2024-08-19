import { Router } from 'express';
import {
    autoCompleteSuggestions,
    deleteVideo,
    getAllVideoExceptOne,
    getAllVideos,
    getVideoById,
    increaseViews,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },

        ]),
        publishAVideo
    );

router.route("/suggestions").post(autoCompleteSuggestions);

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/sideVideos/:videoId").get(getAllVideoExceptOne);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
router.route("/increase/view/:videoId").patch(increaseViews);

export default router