const express = require('express');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const axios = require('axios');
const body_parser = require('body-parser');
var http = require('http').createServer(app);
var io = require('socket.io')(http);

//inicializaciones
const port = process.argv[2];

//middleware
app.use(morgan('dev'));
app.use(body_parser.urlencoded({extended:false}));
app.use(express.json());
app.use(cors());

//Routes
app.get('/berkeley',function(req,res){
    res.json({
        message:'get'
    });
});

//recibe conexiones
io.of('clients').on('connection', (socket) => {
    console.log('A new user connected');
  });

  setTimeout(function() {
    var event = setInterval(function () {
      io.of('clients').emit('time', new Date());
    }, 1000);
  }, 5000);

//iniciar servidor
http.listen(port, () => {
    console.log('listening on *:3000');
  });
