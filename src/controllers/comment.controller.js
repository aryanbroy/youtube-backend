import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    // const video = await Video.findById(videoId);

    let aggregate = Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerInfo",
          pipeline: [
            {
              $project: {
                _id: 0,
                username: 1,
                avatar: 1,
                fullName: 1,
              },
            },
          ],
        },
      },
    ]);
    Comment.aggregatePaginate(aggregate, options, (err, result) => {
        if (err) {
            throw new ApiError(401, err.message);
        }
        return res.status(200).json(new ApiResponse(200, result, "Comments found successfully"));
    })

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "You must log in to add a comment!");
    }

    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Please provide content");
    }

    const comment = await Comment.create({
        content,
        owner: userId,
        video: videoId
    });

    await comment.save();
    return res.status(200).json(new ApiResponse(200, comment, "Comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (req.user?._id.toString() !== comment.owner.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    const { content } = req.body;
    comment.content = content;
    await comment.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (req.user?._id.toString() !== comment.owner.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }


    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(404, "Error deleting the comment");
    }

    return res.status(200).json(new ApiResponse(200, deletedComment, "Comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
