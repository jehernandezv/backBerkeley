const express = require('express');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const axios = require('axios');
const body_parser = require('body-parser');
const SocketIO = require('socket.io');

//inicializaciones
const port = process.argv[2];

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
  console.log('new connection', socket.id);
  socket.on('hour:client', async (data) => {
    const offset = await getoffset(data);
    console.log(offset);
    io.emit('res:time', {
      offset: offset
    });
  });
});



//llamado de la hora a cada cierto tiempo
setInterval(function () {
  io.emit('req:time');
}, 3000);

async function getoffset(timeClient) {
 var offset = 0;
  axios.get('http://worldtimeapi.org/api/timezone/America/Bogota').then(async (response) => {
    const timeApi = await response.data.unixtime;
    dateObj = new Date(timeApi * 1000);
    // Get hours from the timestamp 
    hours = (dateObj.getUTCHours() - 5);
    // Get minutes part from the timestamp 
    minutes = dateObj.getUTCMinutes();
    // Get seconds part from the timestamp 
    seconds = dateObj.getUTCSeconds();
    let auxSecond = 0;
    auxSecond += hours*3600;
    auxSecond+= minutes*60;
    auxSecond+= seconds;
    offset = auxSecond - timeClient.timeClient;
    console.log('method: ' + offset);
    return offset;
  }).catch((error) => {
    console.log(error);
    return 0;
  });
}

