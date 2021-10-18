#!/usr/bin/env node

const DHT = require('@hyperswarm/dht')
const net = require('net')
const pump = require('pump')
const bind = require('bind-easy')

const node = new DHT()

const key = process.argv[2] && Buffer.from(process.argv[2], 'hex')

if (key && key.length === 32) {
  bind.tcp(8080).then(function (server) {
    server.on('connection', function (socket) {
      pump(socket, node.connect(key), socket)
    })
    console.log('Client mode. hyperswarm-http-server available on:')
    console.log('  http://127.0.0.1:' + server.address().port)
  })
} else {
  let port = 0

  const server = node.createServer(function (socket) {
    pump(socket, net.connect(port, 'localhost'), socket)
  })

  server.listen().then(async function () {
    port = await freePort()
    process.env.PORT = port
    console.log('Server mode. To connect run this http-server on any computer')
    console.log('  hyperswarm-http-server ' + server.address().publicKey.toString('hex'))
    console.log()
    console.log('Output from http-server:')
    console.log()
    require('http-server/bin/http-server')
  })
}

function freePort () {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(0)
    server.on('listening', function () {
      const { port } = server.address()
      server.close()
      server.on('close', function () {
        resolve(port)
      })
    })
  })
}

process.once('SIGINT', function () {
  node.destroy().then(function () {
    process.exit()
  })
})
