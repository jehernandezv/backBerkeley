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
var offset = [];

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
io.on('connection',async (socket) => {
  console.log('new connection', socket.id);
  await idsSockets.push(socket.id);

  await socket.on('hour:client',async (data) => {
    
    //console.log(data);
     if (io.engine.clientsCount == 2){
      if(data.id_socket == idsSockets[0]){
          tiempos.push(data.timeClient);
       }else if(data.id_socket == idsSockets[1]){
          tiempos.push(data.timeClient);
       }

       
       let promedio =  ((tiempos[0]+tiempos[1]+tiempos[2])/3);
       console.log('timepo 0: ' + tiempos[0]);
       console.log('timepo 1: ' + tiempos[1]);
       console.log('timepo 2: ' + tiempos[2]);
       console.log('promedio: '+ promedio);

       tiempos.forEach(element => {
         console.log(element);
       });
      
    }



   if(data.id_socket == idsSockets[0]){
    socket.emit('res:time', {
      offset: 'cliente 1'
    });
   }else if(data.id_socket == idsSockets[1]){
    socket.emit('res:time', {
      offset: 'cliente 2'
    });
   }
  
  });
});

function getTimeApi() {
  axios.get('http://worldtimeapi.org/api/timezone/America/Bogota').then((response) => {
    const timeApi = response.data.unixtime;
    dateObj = new Date(timeApi * 1000);
    // Get hours from the timestamp 
    hours = (dateObj.getUTCHours() - 5);
    if(hours < 0){
      hours = 24 + hours; 
    }
    // Get minutes part from the timestamp 
    minutes = dateObj.getUTCMinutes();
    // Get seconds part from the timestamp 
    seconds = dateObj.getUTCSeconds();
    let auxSecond = 0;
    auxSecond += hours*3600;
    auxSecond+= minutes*60;
    auxSecond+= seconds;
    tiempos.push(auxSecond);
  }).catch((error) => {
    console.log(error);
  });
}

//llamado de la hora a cada cierto tiempo
setInterval(function () {
  io.emit('req:time');
  tiempos = [];
  getTimeApi();
  let promedio =  ((tiempos[0]+tiempos[1]+tiempos[2])/3);
       console.log('timepo 0: ' + tiempos[0]);
       console.log('timepo 1: ' + tiempos[1]);
       console.log('timepo 2: ' + tiempos[2]);
       console.log('promedio: '+ promedio);
}, 5000);



