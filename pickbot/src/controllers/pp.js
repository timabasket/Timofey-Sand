const h = require('../helpers/commonHelper');
const th = require('../helpers/taskHelper');
const uh = require('../helpers/uploadHelper');
const fs = require('fs');
const multer = require('multer');
const QRCode = require('qrcode');
const upload = multer({ dest: __dirname + '/../data/uploads' }).fields([{ name: 'fragments', maxCount: 20 }, { name: 'images', maxCount: 20 }]);
const path = require('path');
const { text } = require('express');
const exec = require('child_process').exec;
const TASK_STATUS_NEW = "new";
const TASK_STATUS_INPROGRESS = "inprogress";
const TASK_STATUS_SUCCESS = "success";
const TASK_STATUS_ERROR = "error";
const clearTaskDataIsEnabled = (process.env.AUTOCLEAR === 'yes');

module.exports.videoGetById = (req, res, next) => {
    let errors = [];
    const downloadFile = path.resolve(__dirname + '/../data/export/' + req.params.id + '.mp4');

    try {
        if (fs.existsSync(downloadFile)) {
            res.sendFile(downloadFile);
        } else {
            errors.push('error reading file');
            h.sendJsonResponse(res, 404, { errors: errors });
        }
    } catch (err) {
        errors.push('error reading file');
        h.sendJsonResponse(res, 404, { errors: errors });
    }

};

module.exports.videoDownloadById = async (req, res, next) => {
    let errors = [];
    const downloadFile = path.resolve(__dirname + '/../data/export/' + req.params.id + '.mp4');

    try {
        if (fs.existsSync(downloadFile)) {
            let filename;
            const task = await th.getTaskById(req.params.id);

            if (task !== 'NOT_FOUND') {
                const user = await h.getUserById(task.userId);
                if (user !== 'NOT_FOUND') {
                    filename = [
                        'maker',
                        'usr_' + user.login,
                        h.formatDate(task.finishedAt)
                    ].join('-') + '.mp4';
                }
            }

            if (filename) {
                res.download(downloadFile, filename);
            } else {
                res.download(downloadFile);
            }

        } else {
            errors.push('error reading file');
            h.sendJsonResponse(res, 404, { errors: errors });
        }

    } catch (err) {
        errors.push('error reading file');
        h.sendJsonResponse(res, 404, { errors: errors });

    }
};

module.exports.ppGetAll = async (req, res, next) => {
    let errors = [];
    if (!req.headers.token) {
        errors.push('header "token" is required');
    } else {
        if (!await h.isValidToken(req.headers.token)) {
            errors.push('invalid token');
            h.sendJsonResponse(res, 401, { errors: errors });
            return;
        }
    }

    if (errors.length) {
        h.sendJsonResponse(res, 406, { errors: errors });
        return;
    }

    th.getTasks(req, res);
};

module.exports.ppGetFile = async (req, res) => {
    let errors = [];
    if (!req.headers.token) {
        errors.push('header "token" is required');
    } else {
        if (!await h.isValidToken(req.headers.token)) {
            errors.push('invalid token');
            h.sendJsonResponse(res, 401, { errors: errors });
            return;
        }
    }

    if (errors.length) {
        h.sendJsonResponse(res, 406, { errors: errors });
        return;
    }

    const taskStatus = await th.getTaskStatus(req.params.id);

    if ('success' === taskStatus) {
        const extentionOfFile = await th.getTaskResultExtension(req.params.id);
        //const extentionOfFile = (templateType === 'image') ? '.jpg' : '.mp4';
        console.log('extentionOfFile', extentionOfFile);

        const downloadFile = path.resolve(__dirname + '/../data/export/' + req.params.id + extentionOfFile);

        try {
            if (fs.existsSync(downloadFile)) {
                fs.createReadStream(downloadFile).pipe(res);
                // res.sendFile(downloadFile);
            } else {
                errors.push('error reading file');
                h.sendJsonResponse(res, 404, { errors: errors });
            }
        } catch (err) {
            errors.push('error reading file');
            h.sendJsonResponse(res, 404, { errors: errors });
        }

    } else {
        errors.push('task status is not success: ' + taskStatus);
        h.sendJsonResponse(res, 404, { errors: errors });
    }

};

module.exports.ppGetUploadById = async (req, res, next) => {
    let errors = [];

    const id = req.params.id;

    if (!await uh.isValidUploadId(id)) {
        errors.push('invalid form by this id');
    }

    if (await h.isApiBusy()) {
        errors.push('api is busy');
        h.sendJsonResponse(res, 429, { errors: errors });
        return;
    }

    if (errors.length) {
        h.sendJsonResponse(res, 406, { errors: errors });
        return;
    }

    uh.getUpload(id, (err, uploadEx) => {

        if (err) {
            errors.push(err);
            h.sendJsonResponse(res, 500, { errors: errors });
            return;
        }

        if (uploadEx) {
            h.sendJsonResponse(res, 200, uploadEx);
            return;
        }

        errors.push('upload not found');
        h.sendJsonResponse(res, 404, { errors: errors });

    });

};

module.exports.ppGetById = async (req, res, next) => {
    let errors = [];
    if (!req.headers.token) {
        errors.push('header "token" is required');
    } else {
        if (!await h.isValidToken(req.headers.token)) {
            errors.push('invalid token');
            h.sendJsonResponse(res, 401, { errors: errors });
            return;
        }
    }

    if (errors.length) {
        h.sendJsonResponse(res, 406, { errors: errors });
        return;
    }

    th.getTask(req, res);
};

module.exports.ppGetStatusById = async (req, res, next) => {
    th.getTaskCheckStatus(req, res);
};

module.exports.checkState = async (req, res) => {
    let errors = [];

    if (!req.headers.token) {
        errors.push('header "token" is required');
        h.sendJsonResponse(res, 401, { errors: errors });
        return;
    }

    if (!await h.isValidToken(req.headers.token)) {
        errors.push('invalid token');
        h.sendJsonResponse(res, 401, { errors: errors });
        return;
    }

    if (await h.isApiBusy()) {
        errors.push('api is busy');
        h.sendJsonResponse(res, 429, { errors: errors });
        return;
    }

    h.sendJsonResponse(res, 200, { status: 'success' });
};

module.exports.ppCreate = (req, res, next) => {

    try {
        let mode;
        let errors = [];

        //console.log('test', req.headers);
        //console.log('test2', req.body);

        //h.sendJsonResponse(res, 500, {errors: 'debug'});
        //       return;

        upload(req, res, async (err) => {

            if (err) {
                errors.push(err);
                h.sendJsonResponse(res, 500, { errors: errors });
                return;
            }

            if (await h.isApiBusy()) {
                errors.push('api is busy');
                console.log('api is busy');
                h.sendJsonResponse(res, 429, { errors: errors });
                return;
            }

            if (req.headers['upload-id']) {

                // uploadForm mode
                if (!await uh.isValidUploadId(req.headers['upload-id'])) {
                    errors.push('invalid upload form id');
                    h.sendJsonResponse(res, 401, { errors: errors });
                    return;
                }
                mode = 'uploadForm';

            } else {

                // token mode
                if (!req.headers.token) {
                    errors.push('header "token" is required');
                } else {
                    if (!await h.isValidToken(req.headers.token)) {
                        errors.push('invalid token');
                        h.sendJsonResponse(res, 401, { errors: errors });
                        return;
                    }
                    mode = 'token';
                }

            }

            if (!req.body.template) {
                errors.push('field "template" is required');
            } else {
                if (!await h.isValidTemplate(req.body.template)) {
                    errors.push('invalid template');
                    h.sendJsonResponse(res, 500, { errors: errors });
                    return;
                }
            }

            if (errors.length) {
                h.sendJsonResponse(res, 406, { errors: errors });
                return;
            }

            // create task
            const tokenOrUploadFormId = (mode === 'token') ? req.headers.token : (mode === 'uploadForm') ? req.headers['upload-id'] : null;

            th.createNewTask(mode, tokenOrUploadFormId, async (err, task) => {

                if (err) {
                    errors.push(err);
                    h.sendJsonResponse(res, 500, { errors: errors });
                    return;
                }

                task.status = TASK_STATUS_INPROGRESS;
                task.finishedAt = Date.now();
                await task.save();
                h.sendJsonResponse(res, 200, { status: 'success', task: task });

                // create task dir
                const taskId = task._id;
                const taskDir = [__dirname, '..', 'data', 'tasks', taskId].join('/');
                if (!fs.existsSync(taskDir)) {
                    fs.mkdirSync(taskDir);
                }
                await th.unpackTemplateToTask(taskId, req.body.template);
                const templateType = await th.getTemplateType(taskId);
                async function iterFragments(filename, index) {
                    console.log('iterFragments');
                    return new Promise(async resolve => {

                        const noTranscoding = (req.body.noTranscoding && req.body.noTranscoding === 'yes');

                        if (await th.isVideoFile(filename.path, noTranscoding)) {
                            await fs.copyFile(filename.path, [taskDir, 'fragment-' + h.pad(index + 1, 2) + '.mp4'].join('/'), err => {
                                if (err) {
                                    errors.push(err);
                                    resolve(true);
                                }
                                // remove tmp files
                                fs.unlink(filename.path, err => {
                                    if (err) {
                                        errors.push(err);
                                    }
                                    resolve(true);
                                });
                            });
                        } else {
                            errors.push(filename.originalname + ' is not valid or not videofile');
                            resolve(true);
                            // remove tmp files
                            // fs.unlink(filename.path, err => {
                            //     if (err) {
                            //         errors.push(err);
                            //     }
                            //     resolve(true);
                            // });
                        }
                    });
                }

                async function iterImages(filename, index) {
                    //console.log('iterImages');
                    return new Promise(async resolve => {

                        if (await th.isImageFile(filename.path)) {
                            await fs.copyFile(filename.path, [taskDir, 'image-' + h.pad(index + 1, 2) + '.png'].join('/'), err => {
                                if (err) {
                                    errors.push(err);
                                    resolve(true);
                                }
                                // remove tmp files
                                fs.unlink(filename.path, err => {
                                    if (err) {
                                        errors.push(err);
                                    }
                                    resolve(true);
                                });
                            });
                        } else {
                            errors.push(filename.originalname + ' is not valid or not imagefile');
                            resolve(true);
                            // remove tmp files
                            // fs.unlink(filename.path, err => {
                            //     if (err) {
                            //         errors.push(err);
                            //     }
                            //     resolve(true);
                            // });
                        }
                    });
                }

                async function iterTexts(text, index, templateType) {
                    const configFile = (templateType === 'image') ? 'template.svg' : 'make.tpl.mlt';
                    const find = 'TEXT-' + h.pad(index + 1, 2);
                    const replace = text ? text : 'unknown-template-text';
                    return new Promise(async resolve => {
                        const cmd = [
                            h.SED_BIN + " -i 's/%" + find + "%/" + replace + "/g' " + __dirname + "/../data/tasks/" + taskId + "/" + configFile + ";",
                            'echo $?;'
                        ].join('');
                        exec(cmd, (error, stdout) => {
                            if (error) {
                                resolve(false);
                            }
                            const status = parseInt(stdout);
                            resolve(status === 0);
                        });
                    });
                }

                // copy all fragments to task dir (if exists...)
                if (req.files.fragments) {
                    for (let i = 0; i < req.files.fragments.length; i++) {
                        const filename = req.files.fragments[i];
                        await iterFragments(filename, i);
                    }
                }

                // copy all images to task dir (if exists...)
                if (req.files.images) {
                    if (req.files.images.length) {
                        for (let i = 0; i < req.files.images.length; i++) {
                            const filename = req.files.images[i];
                            await iterImages(filename, i);
                        }
                    }
                }

                // apply qr-codes (if exists...)
                if (req.body.qrcodes) {
                    var qrcodes = req.body.qrcodes.split(',');
                    for (let i = 0; i < qrcodes.length; i++) {
                        const qrcode = qrcodes[i].trim();
                        try {
                            await QRCode.toFile(taskDir + '/qrcode-' + h.pad(i + 1, 2) + '.png', qrcode);
                            console.log('qr-code: ', qrcode);
                        } catch (err) {
                            console.error(err);
                        }
                    }
                }

                if (errors.length) {
                    task.status = TASK_STATUS_ERROR;
                    task.finishedAt = Date.now();
                    await task.save();
                    //  h.sendJsonResponse(res, 406, {errors: errors});
                    return;
                }

                // apply text effects (if exists...)
                if (req.body.texts) {
                    const texts = req.body.texts.split(',');
                    for (let i = 0; i < texts.length; i++) {
                        const text = texts[i].trim();
                        await iterTexts(req.body.template === 'template-torpedo' ? text.toUpperCase() : text, i, templateType);
                    }
                }

                await th.initTemplate(taskId, templateType);

                const isHooksAvail = await th.runHooks(taskId);

                if (isHooksAvail) {
                    console.log('HOOKS: Available');
                } else {
                    console.log('HOOKS: NOT Available');
                }

                switch (templateType) {
                    case "ffmpeg":
                        th.runTaskFFMPEG(taskId, async () => {
                            //
                        }, async (error, stdout) => {
                            const status = parseInt(stdout);
                            if (error) {
                                task.status = TASK_STATUS_ERROR;
                                task.finishedAt = Date.now();
                                await task.save();
                            } else {
                                task.status = TASK_STATUS_SUCCESS;
                                task.finishedAt = Date.now();
                                await task.save();
                                if (clearTaskDataIsEnabled) {
                                    th.clearTaskData(taskId);
                                }
                            }
                        });
                        break;
                    case "image":
                        th.runTaskIMAGE(taskId, async () => {
                            //
                        }, async (error, stdout) => {
                            const status = parseInt(stdout);
                            if (error) {
                                task.status = TASK_STATUS_ERROR;
                                task.finishedAt = Date.now();
                                await task.save();
                            } else {
                                task.status = TASK_STATUS_SUCCESS;
                                task.finishedAt = Date.now();
                                task.resExt = '.jpg';
                                await task.save();
                                if (clearTaskDataIsEnabled) {
                                    th.clearTaskData(taskId);
                                }
                            }
                        });
                        break;
                    default: // melt
                        th.runTaskMELT(taskId, isHooksAvail,
                            async () => {
                                //
                            }, async (error, stdout) => {
                                const status = parseInt(stdout);
                                if (error) {
                                    task.status = TASK_STATUS_ERROR;
                                    task.finishedAt = Date.now();
                                    await task.save();
                                } else {
                                    task.status = TASK_STATUS_SUCCESS;
                                    task.finishedAt = Date.now();
                                    await task.save();
                                }
                            });
                }
            });

        });
    } catch (e) {
        h.sendJsonResponse(res, 500, { error: JSON.stringify(e) });
        //return;
    }

};

module.exports.ppCreateUpload = async (req, res, next) => {

    let errors = [];

    if (!req.headers.token) {
        errors.push('header "token" is required');
    } else {
        if (!await h.isValidToken(req.headers.token)) {
            errors.push('invalid token');
            h.sendJsonResponse(res, 401, { errors: errors });
            return;
        }
    }

    if (!req.body.template) {
        errors.push('field "template" is required');
    }

    if (errors.length) {
        h.sendJsonResponse(res, 406, { errors: errors });
        return;
    }

    // create upload
    uh.createNewUpload(req, (err, uploadEx) => {
        if (err) {
            errors.push(err);
            h.sendJsonResponse(res, 500, { errors: errors });
            return;
        }
        h.sendJsonResponse(res, 200, { status: 'success', upload: uploadEx });
    });

};

module.exports.ppDelete = async (req, res, next) => {

    let errors = [];
    if (!req.headers.token) {
        errors.push('header "token" is required');
    } else {
        if (!await h.isValidToken(req.headers.token)) {
            errors.push('invalid token');
            h.sendJsonResponse(res, 401, { errors: errors });
            return;
        }
    }

    if (errors.length) {
        h.sendJsonResponse(res, 500, { errors: errors });
        return;
    }

    const id = req.params.id;

    const removeResult = await th.removeTask(id);

    if ('success' === removeResult) {
        h.sendJsonResponse(res, 200, { status: 'success removed', taskId: id });
    } else {
        errors.push(removeResult);
        h.sendJsonResponse(res, 500, { errors: errors });
    }

};
