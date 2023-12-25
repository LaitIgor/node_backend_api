let io;

module.exports = {
    init: (httpServer, params) => {
        io = require('socket.io')(httpServer, params);
        return io
    },
    getIo: () => {
        if (!io) {
            throw new Error('Socket.io not initialised!');
        }
        return io;
    }
};