const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const http = require('http');
const users = require('./users')();

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const message = (name, text, id) => ({name, text, id});

app.use(express.static(publicPath));

io.on('connection', (socket) => {
    socket.on('join', (user, callback) => {
        if(!user.name || !user.room) return callback('Invalid user data');
        callback({userId: socket.id});

        socket.join(user.room);
        users.remove(socket.id); //удалим пользователя чтобы не было дубликатов
        users.add(socket.id, user.name, user.room);

        io.to(user.room).emit('users:update', users.getByRoom(user.room));
        socket.emit('message:new', message('Admin', `Привет, ${user.name}!`));
        socket.broadcast.to(user.room).emit('message:new', message('Admin', `${user.name} присоединился к чату`));
    });

    socket.on('message:create', (data, callback) => { //прослушиваем события которые передает сокет с клиента
        if(!data) callback('Сообщение не может быть отправлено!');
        else {
            const user = users.get(data.id);
            if(user) io.to(user.room).emit('message:new', message(data.name, data.text, data.id)); //чтобы показать отправленное сообщение всем, нужно воспользоваться через io, если через socket, то отправится только тому, кто посылал emit на сервер
            callback();
        }
    });

    socket.on('disconnect', () => {
        const user = users.remove(socket.id);
        if(user) {
            io.to(user.room).emit('message:new', message('Admin', `${user.name} покинул чат`));
            io.to(user.room).emit('users:update', users.getByRoom(user.room));
        }
    });
});

server.listen(port);

//socket.emit - отправит сообщение только тому пользователю, от которого он получил сообщение
//io.emit - отправит сообщение всем пользователям, которые подсоединены к сокетам, в том числе и в другие комнаты
//socket.broadcast - отправит сообщение всем пользователям, кроме того, кто ему передал сообщение