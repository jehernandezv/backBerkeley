const express = require('express');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const axios = require('axios');
const body_parser = require('body-parser');
const SocketIO = require('socket.io');

//inicializaciones
const port = process.argv[2];
let conn = [];
let time_api, sumTime, average, offset = 0;
let final_time = 0;

//middleware
app.use(morgan('dev'));
app.use(body_parser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

//Routes
app.get('/berkeley', function (req, res) {
  res.json({
    message: 'get'
  });
});

//iniciar servidor
const server = app.listen(port, () => {
  console.log('listening on port: ' + port);
});

const io = SocketIO(server);
//websockets
io.on('connection', (socket) => {
  console.log('New connection', socket.id);
  socket.on('hour:client', (data) => {
    conn.push({ id: socket.id, time: data.timeClient });

    if (conn.length === io.engine.clientsCount) {
      console.log(data);
      berkeley();
      final_time = offset + data.timeClient

      for (let index = 0; index < conn.length; index++) {
        socket.emit('res:time', {
          offset: conn[index].time
        });
      }

    }
  });
});



var test = [0, 0];
function berkeley() {
  conn.forEach(item => {
    let time_difference = item.time - time_api;
    sumTime += time_difference;
    console.log('ITEM: ' + item.time);
    console.log('TimeAPI: ' + time_api);
  });
  average = sumTime / (test.length + 1);
  total_time = time_api + average;
  for (let index = 0; index < conn.length; index++) {
    conn[index].time = total_time;
    console.log("ITEM SYNC: " + conn[index].time);
  }
  console.log("TIEMPO DE SINCRONIZACIÓN: " + total_time);
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
  }).catch((error) => {
    console.log(error);
  });
}
function reset() {
  conn = [];
  sumTime = 0;
  average = 0;
}

//llamado de la hora a cada cierto tiempo
setInterval(async function () {
  await reset();
  await getTimeApi();
  await io.emit('req:time');
}, 5000);



