const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },

  phone: {
  type: String,
  required: true,
},

testimonial: {
    type: String,
    maxLength: 300,
    required: false,
  },

  collegeId: {
  type: String,
  required: true,
  unique: true,
},
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
