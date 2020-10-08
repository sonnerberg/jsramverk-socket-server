const mongo = require('mongodb').MongoClient
const dsn = 'mongodb://localhost:27017/chat'

const express = require('express')
const app = express()
const cors = require('cors')

const timeFormat = new Intl.DateTimeFormat('sv', {
  timeStyle: 'short',
  timeZone: 'Europe/Stockholm',
})

app.use(cors())

const server = require('http').createServer(app)
const io = require('socket.io')(server)
let connectedUsers = []

// Return a JSON object with list of all documents within the collection.
app.get('/history', async (request, response) => {
  try {
    let res = await findInCollection(dsn, 'crowd', {}, {}, 0)

    console.log(res)
    response.json(res)
  } catch (err) {
    console.log(err)
    response.json(err)
  }
})

if (process.env.NODE_ENV === 'production') {
  io.origins([
    'https://socket-client.sonnerberg.me:443',
    'https://sonnerberg.me:443',
  ])
}

io.on('connection', (socket) => {
  const time = `${timeFormat.format(Date.now())}`
  const message = 'User connected to the chat, awaiting nickname selection...'
  insertInCollection(dsn, 'crowd', { time, message })
  io.emit('chat message', {
    time,
    message,
  })

  // emit back only to the socket
  socket.on('userConnected', async () => {
    console.log('sending all messages to', socket.id)
    const allMessages = await getAllSavedMessages()
    socket.emit('history', allMessages)
  })

  socket.on('chat message', ({ name, message }) => {
    const time = `${timeFormat.format(Date.now())}`
    insertInCollection(dsn, 'crowd', { time, name, message })
    socket.broadcast.emit('chat message', {
      time,
      name,
      message,
    })
  })

  socket.on('join room', ({ name }) => {
    const time = `${timeFormat.format(Date.now())}`
    const message = 'joined the chat.'
    connectedUsers = [...connectedUsers, { name, id: socket.id }]
    insertInCollection(dsn, 'crowd', { time, name, message })
    io.emit('join room', {
      time,
      name,
      message,
      connectedUsers,
    })
  })

  socket.on('disconnect', () => {
    const time = `${timeFormat.format(Date.now())}`
    const leaver = connectedUsers.filter((user) => user.id === socket.id)
    connectedUsers = connectedUsers.filter((user) => user.id !== socket.id)
    const message = `${
      leaver.length ? leaver[0]['name'] : 'User'
    } left the chat`
    io.emit('leave room', {
      connectedUsers,
    })
    io.emit('chat message', {
      time,
      message,
    })
    insertInCollection(dsn, 'crowd', { time, message })
  })
})

server.listen(8300)

/**
 * Find documents in an collection by matching search criteria.
 *
 * @async
 *
 * @param {string} dsn        DSN to connect to database.
 * @param {string} colName    Name of collection.
 * @param {object} criteria   Search criteria.
 * @param {object} projection What to project in results.
 * @param {number} limit      Limit the number of documents to retrieve.
 *
 * @throws Error when database operation fails.
 *
 * @return {Promise<array>} The resultset as an array.
 */
async function findInCollection(dsn, colName, criteria, projection, limit) {
  const client = await mongo.connect(dsn, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  const db = await client.db()
  const col = await db.collection(colName)
  const res = await col.find(criteria, projection).limit(limit).toArray()

  await client.close()

  return res
}

/**
 * Reset a collection by removing existing content and insert a default
 * set of documents.
 *
 * @async
 *
 * @param {string} dsn     DSN to connect to database.
 * @param {string} colName Name of collection.
 * @param {string} doc     Documents to be inserted into collection.
 *
 * @throws Error when database operation fails.
 *
 * @return {Promise<void>} Void
 */
async function insertInCollection(dsn, colName, message) {
  const client = await mongo.connect(dsn, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  const db = await client.db()
  const col = await db.collection(colName)

  await col.insertOne(message)

  await client.close()
}

async function getAllSavedMessages() {
  try {
    let res = await findInCollection(dsn, 'crowd', {}, {}, 50)
    return res
  } catch (err) {
    console.log(err)
    return err
  }
}
