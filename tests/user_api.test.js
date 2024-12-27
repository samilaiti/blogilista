const { test, after, beforeEach, describe } = require('node:test')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const mongoose = require('mongoose')
const supertest = require('supertest')
const assert = require('node:assert')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation fails with invalid username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'st',
      name: 'Seppo Taalasmaa',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('shorter than the minimum allowed length (3)'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)

  })

  test('creation fails with invalid password', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'seppot',
      name: 'Seppo Taalasmaa',
      password: 'ab',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('password must have atleast 3 characters'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)

  })

  test('creation succeeds with fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'samilai',
      name: 'Sami Laitinen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

after(async () => {
  await mongoose.connection.close()
})