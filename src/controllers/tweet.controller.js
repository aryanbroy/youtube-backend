import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(409, "Content cannot be empty");
    }
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "You must log in to create a tweet");
    }

    const createTweet = await Tweet.create({
        content,
        owner: userId,
    });

    const tweet = await Tweet.findById(createTweet._id).populate({
        path: "owner",
        select: "username fullName avatar",
    })

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, "No such user exists")
    }

    const tweets = await Tweet.find({ owner: userId }).populate("owner", "username fullName avatar").sort({ updatedAt: -1 });

    return res.status(200).json(new ApiResponse(200, tweets, "Tweets found successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content cannot be empty");
    }

    if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        content,
    }, { new: true });

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    // const tweetOwnerId = await Tweet.findById(tweetId).select("owner");

    // if (req.user.id !== tweetOwnerId) {
    //     throw new ApiError(400, "You are not authorized to delete this tweet");
    // }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deletedTweet) {
        throw new ApiError(404, "Tweet not found");
    }

    return res.status(200).json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
