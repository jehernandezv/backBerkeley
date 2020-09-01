const express = require('express');
const io = require('socket.io');
const axios = require('axios');
const port = process.argv[2];

const app = express();
const server = app.listen(port, () => {
  console.log('Escuchando en el puerto: ' + port);
});

let socket = io(server);

let list_node = [];
let clients, time_sync;
let time_api = 0;
let time_sum, time_average = 0;

socket.on('connection', node => {
  console.log('Nueva conexión:', node.id);
  node.join('timeReq');
  clients = socket.sockets.adapter.rooms['timeReq'];

  node.on('hour:client', time => {
    list_node.push({ id: node.id, time: time.timeClient });
    if (list_node.length === clients.length) {
      berkeleyAlgorithm();
      node.emit('res:time', { offset: time_sync });
      node.broadcast.emit('res:time', { offset: time_sync });
    }
  });
  node.on('disconnect', () => {
    node.leave('timeReq', '');
    deleteNode(node);
  });
});

function berkeleyAlgorithm() {
  list_node.forEach(slave => {
    let time_difference = time_api - slave.time;
    console.log('API_TIME: ' + time_api);
    console.log('TEST: ' + slave.time);

    time_sum += time_difference;
  });
  console.log('TIEMPO SUMA: ' + time_sum);

  time_average = time_sum / (list_node.length + 1);
  time_sync = time_api + time_average; 
  console.log('TIEMPO PRMEDIO: ' + time_average);
  console.log('TIEMPO DE SINCRONIZADO: ' + time_sync);
}

function deleteNode(node) {
  console.log('Se ha eliminado el nodo con id:', node.id);
  let index = list_node.map(object => {
    return object.id;
  }).indexOf(node.id);
  list_node.splice(index, 1);
}

async function getTimeApi() {
  await axios.get('http://worldtimeapi.org/api/timezone/America/Bogota').then((response) => {
    const timeApi = response.data.unixtime;
    dateObj = new Date(timeApi * 1000);
    hours = (dateObj.getUTCHours() - 5);
    if (hours < 0) {
      hours = 24 + hours;
    }
    minutes = dateObj.getUTCMinutes();
    seconds = dateObj.getUTCSeconds();
    let auxSecond = 0;
    auxSecond += hours * 3600;
    auxSecond += minutes * 60;
    auxSecond += seconds;
    time_api = auxSecond;
  });
}

function reset() {
  list_node = [];
  time_sum = 0;
  time_average = 0;
}

setInterval(async () => {
  await reset();
  await getTimeApi();
  await socket.to('timeReq').emit('req:time');
}, 5000);
