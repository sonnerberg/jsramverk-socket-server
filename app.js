const express = require('express')
const app = express()

const server = require('http').createServer(app)
const io = require('socket.io')(server)

io.on('connection', () => console.log('User connected'))

server.listen(3000)
