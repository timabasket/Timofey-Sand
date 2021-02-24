const h = require('../helpers/commonHelper');
const mongoose = require('mongoose');
const user = mongoose.model('user');
const token = mongoose.model('token');
const crypto = require('crypto');

const passwordSalt = (process.env.PASWDSALT) ? process.env.PASWDSALT : 'simpleDefaultSalt';

function tokenCleaner() {
    token.find({}, (err, tokens) => {
        if(err){
            console.error("tokenCleaner: error getting tokens");
            return;
        }
        tokens.forEach(async tokenEx=>{
           //console.log('tokenCleaner: check iteration');
           if (! await h.isValidToken(tokenEx.token)){
               tokenEx.delete(err=>{
                   console.log('tokenCleaner: delete token ' + tokenEx.token);
               });
           }
        });
    });
}

setInterval(()=>{
    tokenCleaner();
}, 5000);

module.exports.login = async (req, res, next) => {
    let errors = [];
    if(!req.body.login){
        errors.push('field "login" is required');
    } else {
        const foundUsers = await user.find({login: req.body.login}).exec();

        if(!foundUsers.length){
            errors.push('account is not exist');
        }
    }

    if(!req.body.password){
        errors.push('field "password" is required');
    }

    if(errors.length){
        h.sendJsonResponse(res, 406, { errors: errors });
        return;
    }

    const passwordHash = crypto.createHash('sha256').update(req.body.password + passwordSalt ).digest('base64');
    user.find({login: req.body.login, password: passwordHash}, (err, users)=>{
        if(err){
            h.sendJsonResponse(res, 500, err);
            return;
        }

        if(users.length){

            const now = Date.now();
            const tokenTTL = (process.env.TOKENTTLMINUTES) ? parseInt(process.env.TOKENTTLMINUTES) : 15;

            let userToken, tokenExpired;
            if (users[0].login === process.env.CONSTANTTOKENUSER) {
                userToken = process.env.CONSTANTTOKEN; // 'N/kvbpK0Sf0zr27HaCP1Zmi7MzlZrv38TIAVwmsGHvo=';
                tokenExpired = now + 525600 * 60 * 1000;
            } else {
                userToken = crypto.createHash('sha256').update(user.password + Date.now().toString()).digest('base64').toString();
                tokenExpired = now + tokenTTL * 60 * 1000;
            }

            token.create({
                userId: users[0]._id,
                token: userToken,
                expired: tokenExpired
            }, (err, token) => {
                if (err) {
                    h.sendJsonResponse(res, 500, err);
                    return;
                }
                h.sendJsonResponse(res, 200, {status: 'success', login: user.login, token: token.token});
            });

            // token.deleteMany({userId:users[0]._id}, (err, tokens)=>{
            //     if(err){
            //         h.sendJsonResponse(res, 500, err);
            //         return;
            //     }
            // });

        } else {
            errors.push('login error');
            h.sendJsonResponse(res, 401, { errors: errors });
        }
    });
};

module.exports.signup = async (req, res, next) => {

    let errors = [];
    if(!req.body.login){
        errors.push('field "login" is required');
    } else {
        const foundUsers = await user.find({login: req.body.login}).exec();

        if(foundUsers.length){
            errors.push('login is already exists');
        }
    }

    if(!req.body.password){
        errors.push('field "password" is required');
    }

    if(errors.length){
        h.sendJsonResponse(res, 406, { errors: errors });
        return;
    }

    const passwordHash = crypto.createHash('sha256').update(req.body.password + passwordSalt ).digest('base64');

    user.create({login: req.body.login, password: passwordHash}, async (err, user)=>{
        if(err){
            h.sendJsonResponse(res, 500, err);
            return;
        }

        const now = Date.now();
        const tokenTTL = (process.env.TOKENTTLMINUTES) ? parseInt(process.env.TOKENTTLMINUTES) : 15;

        let userToken, tokenExpired;
        if (user.login === process.env.CONSTANTTOKENUSER) {
            userToken = process.env.CONSTANTTOKEN; // 'N/kvbpK0Sf0zr27HaCP1Zmi7MzlZrv38TIAVwmsGHvo=';
            tokenExpired = now + 525600 * 60 * 1000;
        } else {
            userToken = crypto.createHash('sha256').update(user.password + Date.now().toString()).digest('base64').toString();
            tokenExpired = now + tokenTTL * 60 * 1000;
        }

        token.create({
            userId: user._id,
            token: userToken,
            expired: tokenExpired
        }, (err, token)=>{
            if(err){
                h.sendJsonResponse(res, 500, err);
                return;
            }
            h.sendJsonResponse(res, 200, {status:'success creation user', login: user.login, token: token.token});
        });

    });

};

module.exports.logout = async (req, res, next) => {

    let errors = [];
    if (!req.headers.token) {
        errors.push('header "token" is required');
    } else {
        if (!await h.isValidToken(req.headers.token)) {
            errors.push('invalid token');
            h.sendJsonResponse(res, 401, {errors: errors});
            return;
        }
    }

    if (errors.length) {
        h.sendJsonResponse(res, 406, {errors: errors});
        return;
    }

    const login = req.params.login;

    user.find({login: login}, (err, users)=>{
        if(err){
            h.sendJsonResponse(res, 500, err);
            return;
        }

        if(users.length){
            const userId = users[0]._id;
            token.deleteMany({token: req.headers.token}, err => {
                if(err){
                    h.sendJsonResponse(res, 500, err);
                    return;
                }
                h.sendJsonResponse(res, 201, {status:'success logout', login: login, token: ''});
            });
        } else {
            h.sendJsonResponse(res, 200, {status:'already logout', login: login, token: ''});
        }

    });

};

module.exports.selfremoval = async (req, res, next) => {

    let errors = [];
    if (!req.headers.token) {
        errors.push('header "token" is required');
    } else {
        if (!await h.isValidToken(req.headers.token)) {
            errors.push('invalid token');
            h.sendJsonResponse(res, 401, {errors: errors});
            return;
        }
    }

    if (errors.length) {
        h.sendJsonResponse(res, 406, {errors: errors});
        return;
    }

    const login = req.params.login;

    user.find({login: login}, async (err, users)=>{

        if(err){
            h.sendJsonResponse(res, 500, err);
            return;
        }

        if(users.length){
            const userId = users[0]._id;
            await token.deleteMany({userId: userId});
            await user.deleteMany({_id: userId});
            h.sendJsonResponse(res, 200, {status:'success removed', login: login});
        } else {
            h.sendJsonResponse(res, 200, {status:'already removed', login: login});
        }

    });

};