const mongoose = require('mongoose');
const user = mongoose.model('user');
const token = mongoose.model('token');
const upload = mongoose.model('upload');
const h = require('../helpers/commonHelper');
const exec = require('child_process').exec;
const fs = require('fs-extra');

module.exports.isValidUploadId = async (id) => {
    const now = Date.now();
    let uploadEx;
    try {
        uploadEx = await upload.findOne(
            { _id: id }
        ).exec();

        //console.log(uploadEx);

    } catch (e) {
        return false;
    }

    if(!uploadEx){
        return false;
    }

    return (uploadEx.expired > now);
};

module.exports.getUpload = (id, cb) => {
    upload.findOne({_id: id}, cb);
};

module.exports.createNewUpload = (req, cb) => {
    const tokenValue = req.headers.token;
    token.findOne({token: tokenValue}, (err, token) => {
        if(err){
            cb(err);
            return;
        }

        const now = Date.now();
        const uploadTTL = (process.env.UPLOADTTLMINUTES) ? parseInt(process.env.UPLOADTTLMINUTES) : 15;

        let newUpload = {
            userId: token.userId,
            expired: now + uploadTTL * 60 * 1000
        };

        if(req.body.template){
            newUpload.template = req.body.template;
        }

        if(req.body.greetingText){
            newUpload.greetingText = req.body.greetingText;
        }

        if(req.body.thanksText){
            newUpload.thanksText = req.body.thanksText;
        }

        upload.create(newUpload, cb);
    });
};