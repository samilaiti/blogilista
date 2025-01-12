const { test, after, beforeEach, describe } = require('node:test')
const Blog = require('../models/blog')
const mongoose = require('mongoose')
const supertest = require('supertest')
const assert = require('node:assert')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')
const User = require('../models/user')

let token = ''

beforeEach(async () => {
  await User.deleteMany({})

  await api
    .post('/api/users')
    .send(helper.initialUser[0])

  const login = await api.post('/api/login').send({
    username: helper.initialUser[0].username, password: helper.initialUser[0].password
  })

  token = login.body.token

  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

describe('when some initial blogs exists', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      // .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('blogs contain id', async () => {
    const response = await api.get('/api/blogs') //.set('authorization', `Bearer ${token}`)
    const ids = response.body.map(r => r.id)
    assert.strictEqual(ids.length, helper.initialBlogs.length)
  })

  test('likes can be updated', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToUpdated = blogsAtStart[0]

    const updatedBlog = {
      title: blogToUpdated.title,
      author: blogToUpdated.author,
      url: blogToUpdated.url,
      likes: blogToUpdated.likes + 1
    }

    await api
      .put(`/api/blogs/${blogToUpdated.id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')

    const updated = response.body.filter(blog => blog.id === blogToUpdated.id)[0]

    assert.strictEqual(updated.likes, blogToUpdated.likes + 1)
  })
})
// test('there are two blogs', async () => {
//   const response = await api.get('/api/blogs')
//   assert.strictEqual(response.body.length, helper.initialBlogs.length)
// })

// test('the first blog is about React', async () => {
//   const response = await api.get('/api/blogs')

//   const contents = response.body.map(e => e.title)
//   assert(contents.includes('React patterns'))
// })

describe('adding blogs', () => {
  test('a valid blog can be added', async () => {
    const newBlog = {
      title: 'async/await test blog',
      author: 'Sami Laitinen',
      url: 'http://www.blog.fi',
      likes: 11,
    }

    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')

    const titles = response.body.map(r => r.title)

    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)

    assert(titles.includes('async/await test blog'))
  })

  test('blog added without likes has likes set to zero', async () => {
    const newBlog = {
      title: 'test blog wihtout likes',
      author: 'Sami Laitinen',
      url: 'http://www.blog.fi'
    }

    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')

    const addedBlog = response.body.filter(blog => blog.title === newBlog.title)[0]

    assert.strictEqual(addedBlog.likes, 0)
  })

  test('blog without title is not added', async () => {
    const newBlog = {
      author: 'Sami Laitinen',
      url: 'http://www.blog.fi',
      likes: 11,
    }

    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400)

    const response = await api.get('/api/blogs')

    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })

  test('blog without url is not added', async () => {
    const newBlog = {
      title: 'Test blog without url',
      author: 'Sami Laitinen',
      likes: 11,
    }

    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400)

    const response = await api.get('/api/blogs')

    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })
})
// test('a specific blog can be viewed', async () => {
//   const blogsAtStart = await helper.blogsInDb()

//   const blogToView = blogsAtStart[0]

//   const resultBlog = await api
//     .get(`/api/blogs/${blogToView.id}`)
//     .expect(200)
//     .expect('Content-Type', /application\/json/)

//   assert.deepStrictEqual(resultBlog.body, blogToView)
// })

describe('blog deletion', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blog = {
      title: 'Blog for deletion',
      author: 'Sami Laitinen',
      url: 'www.test.fi',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(blog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')
    const blogForDelete = response.body.filter(b => b.title.includes('deletion'))[0]
    console.log('id', blogForDelete.id)

    await api
      .delete(`/api/blogs/${blogForDelete.id}`)
      .set('authorization', `Bearer ${token}`)
      .send()
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    const titles = blogsAtEnd.map(r => r.title)
    assert(!titles.includes(blogForDelete.title))

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
  })
})

after(async () => {
  await mongoose.connection.close()
})