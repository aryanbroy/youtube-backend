import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        throw new ApiError(409, "Name cannot be empty");
    }

    if (!description) {
        throw new ApiError(409, "Description cannot be empty")
    }

    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const playlist = await Playlist.create({
        name,
        description,
        videos: [],
        owner: userId
    });

    if (!playlist) {
        throw new ApiError(401, "Error creating playlist");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist created successfully"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const playlists = await Playlist.find({ owner: userId }).populate("videos").select("name updatedAt");

    if (!playlists) {
        throw new ApiError(400, "Playlists not found")
    }

    return res.status(200).json(new ApiResponse(200, playlists, "Playlists found successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId).populate({
        path: "videos",
        select: "title owner createdAt views thumbnail",
        populate: {
            path: "owner",
            select: "username"
        }
    }).populate({
        path: "owner",
        select: "username avatar"
    });
    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist found successfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(401, "All fields are required");
    }

    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(401, "Video not found");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(401, "Playlist not found")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $addToSet: { videos: videoId }
    }, { new: true, });

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(401, "All fields are required");
    }

    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid id");
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(401, "Video not found")
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(401, "Playlist not found")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $pull: { videos: videoId }
    }, { new: true })

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid id")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);
    if (!playlist) {
        throw new ApiError(401, "Playlist not found")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist deleted successfully"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid id")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description,
        },
        { new: true }
    )

    if (!playlist) {
        throw new ApiError(401, "Playlist not found")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
