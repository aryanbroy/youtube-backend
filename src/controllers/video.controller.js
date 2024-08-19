import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    }

    let myAggregate;

    const pipeline = [
        {
            $search: {
                index: 'videoSearch',
                text: {
                    query,
                    path: ['title', 'description'],
                    fuzzy: {}
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channelOwner",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
    ]

    if (query || userId) {
        if (userId) {
            const user = await User.findById(userId);
            if (!user) {
                // throw new ApiError(404, "No such user with that user id exists");
                // return res.status(404).json(new ApiError(404, "No such user with that user id exists"));
                // return res.status(404).json({ message: "No such user with the user id exists" })
                throw new ApiError(404, "No such user with that user id exists");
            }
            pipeline[0].$match.owner = new mongoose.Types.ObjectId(userId)
        }
        myAggregate = Video.aggregate(pipeline);
    } else {
        myAggregate = Video.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "channelOwner",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                username: 1,
                                avatar: 1,
                            }
                        }
                    ]
                }
            }
        ]);
    }

    Video.aggregatePaginate(myAggregate, options, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json(new ApiError(500, err.message));
        }
        return res.status(200).json(new ApiResponse(200, result, "Videos found successfully"));
    })
})

export const autoCompleteSuggestions = asyncHandler(async (req, res) => {
    const { query } = req.body;

    const suggestions = await Video.aggregate([
        {
            $search: {
                index: "autoCompleteVideos",
                "autocomplete": {
                    "query": query,
                    "path": "title",
                    "tokenOrder": "sequential",
                    // "fuzzy": {},
                    // "score": <options>
                }
            }
        },
        {
            $limit: 10
        },
        {
            $project: {
                title: 1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, suggestions, "Suggestions found successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(400, "Please provide title and description");
    }
    // TODO: get video, upload to cloudinary, create video
    // console.log(title, description)
    // get username from req.user
    // get video from req.files
    // get thumbnail from req.files
    // upload video and thumbnail to cloudinary
    // get video and thumbnail url from cloudinary
    // store the video and thumbnail url in the database
    // add title and description to the database
    // add the user's id to the owner field

    const userId = req.user._id;


    if (!userId) {
        throw new ApiError(400, "You need to be logged in to publish a video");
    }

    const videoPath = req.files?.videoFile[0].path;

    const thumbnailPath = req.files?.thumbnail[0].path;

    // console.log(username, videoPath, thumbnailPath)

    if (!videoPath || !thumbnailPath) {
        throw new ApiError(400, "Please upload video and thumbnail");
    }

    const videoFile = await uploadOnCloudinary(videoPath);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    // below code is to convert duration from seconds format to standard hr:min:sec format

    // console.log(videoFile)
    // const duration = videoFile.duration;
    // const hour = Math.floor(duration / 3600);
    // const minute = Math.floor((duration % 3600) / 60);
    // const seconds = Math.floor((duration % 3600) % 60);

    // const durationInStandardForm = `${hour}hr ${minute}min ${seconds}sec`

    if (!videoFile || !thumbnail) {
        throw new ApiError(400, "Something went wrong while uploading video and thumbnail");
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: userId,
        title,
        description,
        duration: videoFile.duration,
        views: 0,
        isPublished: true
    })

    return res.status(200).json(new ApiResponse(200, video, "Video uploaded successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    // yet to be checked in postman

    const { videoId } = req.params

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId).populate({
        path: "owner",
        select: "username fullName avatar"
    });
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res.status(200).json(new ApiResponse(200, video, "Video found successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    // const user = req.user;

    // if (!user) {
    //     throw new ApiError(400, "You need to be logged in to delete a video");
    // }

    const video = await Video.findByIdAndDelete(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // console.log(video.owner.toString() === user._id.toString());

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are not authorized to delete this video");
    }

    return res.status(200).json(new ApiResponse(200, [], "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are not authorized to update this video");
    }

    video.isPublished = !video.isPublished;

    await video.save();
    return res.status(200).json(new ApiResponse(200, video, "Video status updated successfully"));
});

export const getAllVideoExceptOne = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    // const videos = await Video.find({ _id: { $ne: videoId } }).limit(10);
    const videos = await Video.aggregate([
        {
            $match: {
                _id: {
                    $ne: new mongoose.Types.ObjectId(videoId)
                }
            }
        },
        {
            $sample: { size: 10 }
        }
    ]);

    const allVideos = await Video.countDocuments();

    if (videos.length === allVideos) {
        throw new ApiError(404, "No video exists with that id");
    }

    const populatedVideos = await Video.populate(videos, { path: "owner", select: "username fullName" });

    return res.status(200).json(new ApiResponse(200, populatedVideos, "Videos found successfully"));

});

export const increaseViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.views += 1;

    await video.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, video, "Views increased successfully"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
