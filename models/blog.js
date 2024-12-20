const logger = require('../utils/logger')
const config = require('../utils/config')
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const url = config.MONGODB_URI

logger.info('connecting to', url)
mongoose.connect(url)

const blogSchema = mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number
})
  
module.exports = mongoose.model('Blog', blogSchema)