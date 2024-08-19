import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        const totalVideos = await Video.countDocuments({ owner: userId });
        const totalSubscribers = await Subscription.countDocuments({ channel: userId });
        const totalViews = await Video.aggregate([
            {
                $match: {
                    owner: userId
                }
            },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" }
                }
            }
        ]);

        const totalVideoLikes = await Like.countDocuments({
            $and: [
                {
                    video: { $exists: true }
                },
                {
                    likedBy: userId
                }
            ]
        });

        return res.status(200).json(new ApiResponse(200, { totalSubscribers, totalVideos, totalViews: totalViews[0].totalViews, totalVideoLikes }, "Videos found successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    try {
        const channelId = req.params.channelId;

        if (!mongoose.isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid channel id");
        }

        const videos = await Video.find({ owner: channelId });

        if (!videos) {
            return res.status(200).json(new ApiResponse(200, [], "This channel currently has no videos"))
        }

        return res.status(200).json(new ApiResponse(200, videos, "Videos found successfully"))
    } catch (error) {
        throw new ApiError(500, error.message);
    }
})

export {
    getChannelStats,
    getChannelVideos
}