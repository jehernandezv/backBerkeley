const express = require('express');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const axios = require('axios');
const body_parser = require('body-parser');
const SocketIO = require('socket.io');

//inicializaciones
const port = process.argv[2];
var tiempos = [];
var idsSockets = [];
var coordinador;


let conn = [];
let time_api,total_time, average, ajuste, offset = 0;



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
    conn.push({id:socket.id,time:data.timeClient});

    if(conn.length === io.engine.clientsCount){
      console.log(data);
      berkeley();

      socket.emit('res:time', {
        offset: data.timeClient + offset
      });
      total_time =  0;
      average = 0;
      conn = [];
      time_api = 0;
      ajuste = 0;
      offset = 0;
     }
 });
});

function berkeley(){
  conn.forEach(element => {
    let rest = time_api - element.time;
    total_time += rest;
  });

  ajuste = total_time / conn.length;
  offset = time_api + ajuste;
  
  console.log('ajuste: ' + ajuste);
  console.log('total: ' + total_time);
  console.log('api: ' + time_api);
}
/*
//websockets
io.on('connection', (socket) => {
  console.log('New connection', socket.id);
  idsSockets.push(socket.id);
  socket.on('hour:client', (data) => {
    console.log(data);
    if (io.engine.clientsCount == 2) {

      if (data.id_socket == idsSockets[0]) {
        tiempos.push(data.timeClient);
      }
      if (data.id_socket == idsSockets[1]) {
        tiempos.push(data.timeClient);
      }

      if (tiempos.length == 3) {
        coordinador = tiempos[0];
        for (let index = 1; index < tiempos.length; index++) {
          offset.push(coordinador - tiempos[index],);
        }
        for (let index = 0; index < offset.length; index++) {
          console.log('offset: ' + index + ' : ' + offset[index]);
        }
        switch (true) {
          case data.id_socket == idsSockets[0]:
            console.log('emit 1: ' + offset[0]);
            socket.emit('res:time', {
              offset: offset[0]
            }); break;
          case data.id_socket == idsSockets[1]:
            console.log('emit 2: ' + offset[1]);
            socket.emit('res:time', {
              offset: offset[1]
            }); break;
        }
        tiempos = [];
        offset = [];
      }
    }
  });
});
*/
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

//llamado de la hora a cada cierto tiempo
setInterval(async function () {
  await getTimeApi();
  await io.emit('req:time');
}, 5000);



