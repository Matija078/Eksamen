const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Blog', BlogSchema);
