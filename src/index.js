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
  console.log('listening on *:3000');
});

const io = SocketIO(server);

//websockets
io.on('connection', (socket) => {
  console.log('new connection',socket.id);
  socket.on('hour:client',(data) => {
      const offset = getoffset(data);
      io.emit('res:time',{
        offset:'ajuste'
      });
  });
});

//llamado de la hora a cada cierto tiempo
setInterval(function () {
  io.emit('req:time');
}, 3000);

function getoffset(timeClient){
  console.log(timeClient);
}

