const express = require('express');
const io = require('socket.io');
const axios = require('axios');
const port = process.argv[2];

// Socket.io Implementation
const app = express();
const server = app.listen(port, () => {
  console.log('listening on port: ' + port);
});

let socket = io(server);

// App

let baseServerUrl = 'http://worldtimeapi.org/api/timezone/America/Bogota';
let nodes = [];
let clients, master_time, synchronized_time;
let allDifferencesSum, average_time = 0;

// Socket Listener
socket.on('connection', node => {
  console.log('Node connected:', node.id);
  node.join('time room');
  clients = socket.sockets.adapter.rooms['time room'];

  node.on('hour:client', time => {
    nodes.push({ id: node.id, time: time.timeClient });
    if (nodes.length === clients.length) {
      berkeleyAlgorithm();
      node.emit('res:time', { offset: synchronized_time });
      node.broadcast.emit('res:time', { offset: synchronized_time });
    }
  });

  node.on('disconnect', () => {
    node.leave('time room', '');
    deleteDisconnectedNode(node);
  });
});

let time_api = 0;
function berkeleyAlgorithm() {
  nodes.forEach(slave => {
    let time_difference = time_api - slave.time;
    console.log('API_TIME: ' + time_api);
    console.log('TEST: ' + slave.time);

    allDifferencesSum += time_difference;
  });
  console.log('TIEMPO SUMA: ' + allDifferencesSum);

  average_time = allDifferencesSum / (nodes.length);
  synchronized_time = time_api + average_time; 
  console.log('TIEMPO PRMEDIO: ' + average_time);
  console.log('TIEMPO DE SINCRONIZADO: ' + synchronized_time);
}

function deleteDisconnectedNode(node) {
  console.log('Node disconnected:', node.id);
  let index = nodes.map(object => {
    return object.id;
  }).indexOf(node.id);
  nodes.splice(index, 1);
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

function resetAlgorithmTime() {
  nodes = [];
  allDifferencesSum = 0;
  average_time = 0;
}

setInterval(async () => {
  await resetAlgorithmTime();
  await getTimeApi();
  await socket.to('time room').emit('req:time');
}, 5000);
