const express = require('express')
const app = express()
const cors = require('cors')

const timeFormat = new Intl.DateTimeFormat('sv', {
  timeStyle: 'medium',
})

app.use(cors())

const server = require('http').createServer(app)
const io = require('socket.io')(server)

if (process.env.NODE_ENV === 'production') {
  io.origins(['https://socket-client.sonnerberg.me:443'])
}

io.on('connection', (socket) => {
  console.log('User connected')
  io.emit('chat message', `${timeFormat.format(Date.now())}: User connected`)

  socket.on('chat message', (nickname, message) => {
    io.emit(
      'chat message',
      `${timeFormat.format(Date.now())} ${nickname}: ${message}`,
    )
  })
})

server.listen(8300)
