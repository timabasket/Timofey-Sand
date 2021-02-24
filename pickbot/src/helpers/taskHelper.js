const mongoose = require('mongoose');
const user = mongoose.model('user');
const token = mongoose.model('token');
const task = mongoose.model('task');
const upload = mongoose.model('upload');
const h = require('../helpers/commonHelper');
const uh = require('../helpers/uploadHelper');
const exec = require('child_process').exec;
const fs = require('fs');

module.exports.getTasks = (req, res) => {
    token.findOne({token: req.headers.token}, (err, token) => {
        if(err){
            h.sendJsonResponse(req, 500, err);
            return;
        }
        task.find({userId:token.userId}, (err, tasks) => {
            if(err){
                h.sendJsonResponse(req, 500, err);
                return;
            }
            h.sendJsonResponse(res, 200, tasks);
        }).sort({_id: -1});
    });
};

module.exports.getTask = (req, res) => {
    let errors = [];
    const id = req.params.id;

    token.findOne({token: req.headers.token}, (err, token) => {
        if(err){
            errors.push(err);
            h.sendJsonResponse(res, 500, {errors: errors});
            return;
        }
        if(!h.isValidToken(token.token)){
            errors.push("invalid token");
            h.sendJsonResponse(res, 500, {errors: errors});
            return;
        }
        task.findOne({userId:token.userId, _id:id}, (err, taskEx) => {
            if(err){
                errors.push(err);
                h.sendJsonResponse(res, 500, {errors: errors});
                return;
            }

            if(taskEx){
                h.sendJsonResponse(res, 200, taskEx);
            } else {
                errors.push('task not found');
                h.sendJsonResponse(res, 404, {errors: errors});
            }

        });
    });
};

module.exports.getTaskCheckStatus = (req, res) => {
    let errors = [];
    const id = req.params.id;

    //console.log('wtf?', id);

    task.findOne({_id:id}, (err, taskEx) => {
        if(err){
            errors.push(err);
            h.sendJsonResponse(res, 500, {errors: errors});
            return;
        }
        if(taskEx){
            h.sendJsonResponse(res, 200, taskEx);
        } else {
            errors.push('task not found');
            h.sendJsonResponse(res, 404, {errors: errors});
        }
    });
};

module.exports.isVideoFile = (file, noTranscoding) => {
    return new Promise(resolve => {

        let useTranscoding = true;
        if(noTranscoding){
            useTranscoding = false;
        }

        if(useTranscoding){

            const cmd = [
                h.CP_BIN, ' ', file, ' ', file + '.4transcoding', ';',
                h.FFMPEG_BIN, ' ', '-i', ' ', file + '.4transcoding', ' ', '-preset fast', ' ', file + '.mp4', ';',
                h.CP_BIN, ' ', file + '.mp4', ' ', file, ';',
                h.RM_BIN, ' ', file + '.4transcoding;'
            ].join('');
            console.log('convert to MP4 detected');

            exec(cmd, async (error, stdout) => {
                if(error){
                    resolve(false);
                }
                resolve(await module.exports.isVideoFile(file, true));
            });
            return;
        }

        const cmd = [
            h.FFPROBE_BIN,
            '-v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1',
            file
        ].join(' ');

        //console.log('CMD?', cmd);

        exec(cmd, (error, stdout) => {
            if(error){
                resolve(false);
            }

            if(stdout === 'N/A\n'){
                console.log('file is not h264. save without extention...');

                resolve(true);

                // const cmdMv1 = [
                //     'mv',
                //     file,
                //     file + '.webm'
                // ].join(' ');
                //
                // const cmdTranscode = [
                //     h.FFMPEG_BIN,
                //     '-i',
                //     file + '.webm',
                //     '-preset fast',
                //     file + '.mp4'
                // ].join(' ');
                //
                // const cmdMv2 = [
                //     'mv',
                //     file + '.mp4',
                //     file
                // ].join(' ');
                //
                // const cmdRm = [
                //     'rm',
                //     file + '.webm'
                // ].join(' ');
                //
                // const cmd1 = [cmdMv1, cmdTranscode, cmdMv2, cmdRm].join(';');
                //
                // exec(cmd1, async (error, stdout) => {
                //     if(error){
                //         resolve(false);
                //     }
                //     resolve(await module.exports.isVideoFile(file));
                // });

            } else {
                const duration = parseInt(stdout);
                resolve(duration > 0);
            }

        });

    });
};

module.exports.isImageFile = (file) => {
    const validImageTypes = [
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/png',
        'image/webp'
    ];
    const destinationImageType = 'image/png';

    return new Promise(resolve => {
        const cmd = [ h.FILE_BIN, '-b --mime-type', file ].join(' ');
        //console.log('CMD FILE_BIN?', cmd);
        exec(cmd, (error, stdout) => {
            if(error){
                resolve(false);
            }
            const cmdResult = stdout.replace('\n', '');
            const isNormalImage = (validImageTypes.indexOf(cmdResult) > -1);
            if (isNormalImage) {
                const isAlreadyNormalType = (destinationImageType === cmdResult);
                // convert to png if image is not PNG
                if (!isAlreadyNormalType) {
                    const srcFilename = file + '_4convert.' + (validImageTypes[validImageTypes.indexOf(cmdResult)]).split('/')[1];
                    const dstFilename = file + '_4convert.png';
                    const cmd = [
                        h.CP_BIN, file, srcFilename + ';',
                        h.CONVERT_BIN, srcFilename, '-quality 100%', dstFilename + ';',
                        h.CP_BIN, dstFilename, file +';',
                        h.RM_BIN, srcFilename, dstFilename + ';'
                    ].join(' ');
                    //console.log('CMD CONVERT_BIN?', cmd);
                    exec(cmd, (error, stdout) => {
                        if (error) { resolve(false);}
                        console.log('convert to PNG detected');
                        resolve(true);
                    });
                } else {
                    resolve(true);
                }
            } else {
                resolve(false);
            }
        });
    });
};

module.exports.createNewTask = async (mode, tokenOrUploadFormId, cb) => {

    if(!mode && !tokenOrUploadFormId){
        cb('error task creation: invalid mode and token or upload form id');
        return;
    }

    switch (mode) {
        case 'token':
            token.findOne({token: tokenOrUploadFormId}, (err, token) => {
                if(err){
                    cb(err);
                    return;
                }
                task.create({userId: token.userId}, cb);
            });
            break;
        case 'uploadForm':

            if(!await uh.isValidUploadId(tokenOrUploadFormId)){
                cb('error task creation: upload form expired');
                return;
            }

            upload.findOne({_id: tokenOrUploadFormId}, async (err, uploadEx) => {
                if(err){
                    cb(err);
                    return;
                }
                const userId = uploadEx.userId;
                await uploadEx.delete();
                task.create({userId: userId}, cb);
            });
            break;
        default:
            cb('error task creation: invalid mode');
            return;
    }
};

module.exports.unpackTemplateToTask = (taskId, templateName) => {
    //console.log('unpackTemplateToTask');
    return new Promise(resolve => {
        const cmd = [
            h.CD_BIN + ' ' + __dirname + '/../data/tasks/' + taskId + ';',
            h.UNZIP_BIN + ' ' + __dirname + '/../data/templates/' + templateName + '.zip' + ';',
            'echo $?;'
        ].join('');

        //console.log('unpackTemplateToTask: ' + cmd);
        exec(cmd, (error, stdout) => {
            if(error){
                resolve(false);
            }
            const status = parseInt(stdout);
            //console.log('status?', status);
            resolve(status === 0);
        });
    });
};

module.exports.getTemplateType = (taskId) => {
    return new Promise(resolve => {
        const cmd = 'ls ' + __dirname + '/../data/tasks/' + taskId + ' | grep ffmake.sh | wc -l;';
        const cmd2 = 'ls ' + __dirname + '/../data/tasks/' + taskId + ' | grep imagemake.sh | wc -l;';
        exec(cmd, (error, stdout) => {
            if(error){
                resolve(false);
                return;
            }
            const status = parseInt(stdout);
            if(status === 1) {
                resolve('ffmpeg');
            } else {
                exec(cmd2, (error, stdout) => {
                    if(error){
                        resolve(false);
                        return;
                    }
                    const status = parseInt(stdout);
                    if(status === 1) {
                        resolve('image');
                    } else {
                        resolve ('melt');
                    }
                });
            }
        });
    });
};

module.exports.runHooks = (taskId) => {
    return new Promise(resolve => {
        const cmd = 'ls ' + __dirname + '/../data/tasks/' + taskId + ' | grep hooks.sh | wc -l;';
        exec(cmd, (error, stdout) => {
            if(error){
                resolve(false);
                return;
            }
            const status = parseInt(stdout);
            if(status === 1) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
};

module.exports.initTemplate = (taskId, templateType) => {
    switch (templateType) {
        case "ffmpeg":
            console.log('initTemplate ffmpeg');
            return new Promise(resolve => {
                resolve(true);
            });
        case "image":
            console.log('initTemplate image');
            return new Promise(resolve => {
                resolve(true);
            });
        default: // melt
            console.log('initTemplate melt');
            const location = (__dirname + "/../data/tasks/" + taskId).replace(/\//gi, "\\/");
            const output = (__dirname + "/../data/export/" + taskId + '.mp4').replace(/\//gi, "\\/");

            return new Promise(resolve => {
                const cmd = [
                    h.SED_BIN + " -i 's/%LOCATION%/" + location + "/g' " + __dirname + "/../data/tasks/" + taskId + "/make.tpl.mlt;",
                    h.SED_BIN + " -i 's/%OUTPUT%/" + output + "/g' " + __dirname + "/../data/tasks/" + taskId + "/make.tpl.mlt;",
                    'echo $?;'
                ].join('');

                exec(cmd, (error, stdout) => {
                    if(error){
                        resolve(false);
                    }
                    const status = parseInt(stdout);
                    resolve(status === 0);
                });
            });
    }
};

module.exports.getTaskStatus = (id) => {
  return new Promise(resolve => {
      task.findOne({_id:id}, (err, taskEx) => {
          if(err){
                resolve(err);
                return;
          }

          if(taskEx){
              resolve(taskEx.status);
          } else {
              resolve('task not found');
          }


      });
  });
};

module.exports.getTaskResultExtension = (id) => {
  return new Promise(resolve => {
      task.findOne({_id:id}, (err, taskEx) => {
          if(err){
                resolve(err);
                return;
          }

          if(taskEx){
              resolve(taskEx.resExt);
          } else {
              resolve('NOT_FOUND');
          }
      });
  });
};

module.exports.getTaskById = (id) => {
    return new Promise(resolve => {
        task.findOne({_id:id}, (err, taskEx) => {
            if(err){
                resolve('NOT_FOUND');
                return;
            }

            if(taskEx){
                resolve(taskEx);
            } else {
                resolve('NOT_FOUND');
            }
        });
    });
};

module.exports.removeTask = (id) => {

    return new Promise(resolve => {
        task.findOne({_id:id}, async (err, taskEx) => {

                if(err){
                    resolve(err);
                    return;
                }

                if(!taskEx) {
                    resolve('task not found');
                    return;
                }

                task.deleteMany({_id:id}, err => {

                    if(err){
                        resolve(err);
                        return;
                    }

                    try {
                        fs.removeSync(__dirname + '/../data/tasks/' + id);
                        fs.removeSync(__dirname + '/../data/export/' + id + '.mp4');
                    } catch (e) {
                        resolve(e);
                        return;
                    }

                    resolve('success');

                });
            }
        );
    });

};

module.exports.runTaskMELT = (taskId, isHookAvail, inProgressCB, finishedCB) => {
    console.log('runTaskMELT');
    let cmd;
        if(isHookAvail){
            cmd = [
                h.CD_BIN + ' ' + __dirname + '/../data/tasks/' + taskId + ';',
                '/bin/bash ./hooks.sh' + ';',
                h.QMELT_BIN,
                ' ',
                __dirname + "/../data/tasks/" + taskId + '/make.tpl.mlt 2>/dev/null;',
                'echo $?'
            ].join('');
        } else {
            cmd = [
                h.QMELT_BIN,
                ' ',
                __dirname + "/../data/tasks/" + taskId + '/make.tpl.mlt 2>/dev/null;',
                'echo $?'
            ].join('');
        }
        inProgressCB();
        exec(cmd, finishedCB);
};

module.exports.runTaskFFMPEG = (taskId, inProgressCB, finishedCB) => {
    console.log('runTaskFFMPEG');
    const cmd = [
        'cd ',
        __dirname + "/../data/tasks/" + taskId + ';',
        '/bin/bash ./ffmake.sh;',
        'mv ./result.mp4 ',
        __dirname + "/../data/export/" + taskId + '.mp4;',
        'echo $?'
    ].join('');

    console.log('runTaskFFMPEG', cmd);

    inProgressCB();
    exec(cmd, finishedCB);
};

module.exports.runTaskIMAGE = (taskId, inProgressCB, finishedCB) => {
    console.log('runTaskIMAGE');
    const cmd = [
        'cd ',
        __dirname + "/../data/tasks/" + taskId + ';',
        '/bin/bash ./imagemake.sh;',
        'mv ./result.jpg ',
        __dirname + "/../data/export/" + taskId + '.jpg;',
        'echo $?'
    ].join('');
    inProgressCB();
    exec(cmd, finishedCB);
};

module.exports.clearTaskData = (taskId) => {
     console.log('clearTaskData');
     const cmd = "rm -r " + __dirname + "/../data/tasks/" + taskId;
     exec(cmd);
};