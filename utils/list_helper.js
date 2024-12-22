const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  if (blogs.length === 0) {
    return 0
  }

  const total = blogs.reduce((accum, curr) => accum + curr.likes, 0)

  return total
}

const favoriteBlog = (blogs) => {
  const sorted = blogs.sort((a, b) => a.likes - b.likes)
  const id = sorted[blogs.length - 1]._id
  mostLiked = blogs.filter(blog => blog._id === id)[0]
  return mostLiked
}

const mostBlogs = (blogs) => {
  const grouped = _.countBy(blogs, 'author')
  const result = {
    author: Object.keys(grouped)[0],
    blogs: Object.values(grouped)[0]
  }
  return result
}

const mostLikes = (blogs) => {
  var summedByLikes = _(blogs).groupBy('author')
    .map((objs, key) => ({
      'author': key,
      'likes': _.sumBy(objs, 'likes')
    })).value()
  const sorted = summedByLikes.sort((a, b) => a.likes - b.likes)
  return sorted[sorted.length - 1]
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}