const express = require('express')
const app = express()

const server = require('http').createServer(app)
const io = require('socket.io')(server)

io.on('connection', (socket) => {
  console.log('User connected')

  socket.on('chat message', (message) => {
    io.emit('chat message', message)
  })
})

server.listen(3000)
