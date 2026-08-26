import mongoose from "mongoose";



const linkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "A link must have a user"],
  },
  url: {
    type: String,
    required: [true, "A link must have a URL"],
  },
  status: {
    type: String,
    enum: ["checking", "ok", "dead"],
    default: "checking",
  },
  httpStatus: {
    type: Number,
  },

  title: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  siteName: {
    type: String,
    default: null,
  },
  tags: {
    type: [String],
    default: [],
  },
  lastCheckedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Composite index 1: Fast queries for "this user's links, newest first"
linkSchema.index({ user: 1, createdAt: -1 });

// Multikey index 2: Fast tag filtering for "this user's links tagged X"
linkSchema.index({ user: 1, tags: 1 });

const Link = mongoose.model("Link", linkSchema);

export default Link;
