const express = require('express')
const app = express()
const cors = require('cors')
const moment = require('moment')
moment.locale('sv')

app.use(cors())

const server = require('http').createServer(app)
const io = require('socket.io')(server)

if (process.env.NODE_ENV === 'production') {
  io.origins(['https://socket-client.sonnerberg.me:443'])
}

io.on('connection', (socket) => {
  console.log('User connected')
  io.emit('chat message', `${moment().format('LTS')}: User connected`)

  socket.on('chat message', (message) => {
    io.emit('chat message', `${moment().format('LTS')}: ${message}`)
  })
})

server.listen(8300)
