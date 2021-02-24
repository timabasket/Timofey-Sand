let mongoose = require('mongoose');

const dbURI = "mongodb://mongo/fe_pp";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', ()=>{
    console.log('Mongoose connected to ' + dbURI);
});

mongoose.connection.on('error', err => {
    console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});


let readLine = require('readline');

if(process.platform === "win32"){
    let rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('SIGINT', () => {
        process.emit('SIGINT');
    });
}

let gracefullShutdown = (msg, callback) => {
    mongoose.connection.close(() => {
        console.log('Mongoose disconnected through ' + msg);
        callback();
    });
};

process.once('SIGUSR2', ()=>{
    gracefullShutdown('App stopped by SIGUSR2', ()=>{
        process.kill(process.pid, 'SIGUSR2');
    });
});

process.on('SIGINT', ()=>{
    gracefullShutdown('App stopped by SIGINT', ()=>{
        process.exit(0);
    });
});

process.on('SIGTERM', ()=>{
    gracefullShutdown('App stopped by SIGTERM', ()=>{
        process.exit(0);
    });
});

require('./users');
require('./token');
require('./task');
require('./upload');