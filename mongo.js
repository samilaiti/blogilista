require('dotenv').config()
const mongoose = require('mongoose')

const url = process.env.TEST_MONGODB_URI

mongoose.set('strictQuery', false)
mongoose.connect(url)

const blogSchema = mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number
})

const Blog = mongoose.model('Blog', blogSchema)

if (process.argv.length === 5) {
  const blog = new Blog({
    title: process.argv[0],
    author: process.argv[1],
    url: process.argv[2],
    likes: process.argv[3],
  })

  blog.save().then(() => {
    console.log('blog saved')
    mongoose.connection.close()
  })
}