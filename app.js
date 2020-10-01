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

if (process.env.NODE_ENV === 'production') {
  io.origins(['https://socket-client.sonnerberg.me:443'])
}

io.on('connection', (socket) => {
  const time = `${timeFormat.format(Date.now())}`
  const message = 'User connected to the chat, awaiting nickname selection...'
  io.emit('chat message', {
    time,
    message,
  })

  socket.on('chat message', ({ name, message }) => {
    const time = `${timeFormat.format(Date.now())}`
    io.emit('chat message', {
      time,
      name,
      message,
    })
  })

  socket.on('join room', ({ name }) => {
    const time = `${timeFormat.format(Date.now())}`
    const message = 'joined the chat.'
    connectedUsers = [...connectedUsers, { name, id: socket.id }]
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
    io.emit('leave room', {
      connectedUsers,
    })
    io.emit('chat message', {
      time,
      message: `${leaver.length ? leaver[0]['name'] : 'User'} left the chat`,
    })
  })
})

server.listen(8300)
