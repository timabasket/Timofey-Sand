const mongoose = require('mongoose');
const user = mongoose.model('user');
const token = mongoose.model('token');
const task = mongoose.model('task');
const fs = require('fs-extra');
const path = require('path');

module.exports.FFMPEG_BIN = "LD_LIBRARY_PATH=/opt/Shotcut/Shotcut.app/lib /opt/Shotcut/Shotcut.app/ffmpeg";
module.exports.FFPROBE_BIN = "LD_LIBRARY_PATH=/opt/Shotcut/Shotcut.app/lib /opt/Shotcut/Shotcut.app/ffprobe";
module.exports.QMELT_BIN = "LC_ALL=C /opt/Shotcut/Shotcut.app/melt";
module.exports.UNZIP_BIN = "/usr/bin/unzip -o";
module.exports.CD_BIN = "cd";
module.exports.CP_BIN = "/usr/bin/cp";
module.exports.RM_BIN = "/usr/bin/rm";
module.exports.SED_BIN = "/usr/bin/sed";
module.exports.CONVERT_BIN = "/usr/bin/convert";
module.exports.FILE_BIN = "/usr/bin/file";

module.exports.sendJsonResponse = (res, status, content) => {
    res.status(status);
    res.json(content);
};

module.exports.pad = (num, size) => {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
};

module.exports.formatDate = (millitime) => {
    let d = new Date(millitime);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + '_' + d.getHours() + '-' + d.getMinutes();
};


module.exports.isValidToken = async (tokenValue) => {
    const now = Date.now();
    const validToken = await token.findOne(
        {token: tokenValue}
    ).exec();

    if (!validToken) {
        return false;
    }

    return (validToken.expired > now);
};

module.exports.isValidTemplate = async (template) => {
    const checkFile = path.resolve(__dirname + '/../data/templates/' + template + '.zip');
    return !!(fs.existsSync(checkFile));
};

module.exports.isApiBusy = async () => {
    const tasksCountLimit = (process.env.LIMITOFPROC) ? parseInt(process.env.LIMITOFPROC) - 1 : 3;
    return new Promise(resolve => {
        task.find({status: 'inprogress'}, (err, tasks) => {
            resolve((parseInt(tasks.length) > tasksCountLimit));
        });
    });
};

module.exports.getUserById = (id) => {
    return new Promise(resolve => {
        user.findOne({_id: id}, (err, userEx) => {
            if (err) {
                resolve('NOT_FOUND');
                return;
            }

            if (userEx) {
                resolve(userEx);
            } else {
                resolve('NOT_FOUND');
            }
        });
    });
};
