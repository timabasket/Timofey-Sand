let mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

const tokenSchema = mongoose.Schema({
    userId: {type: String, required: true},
    token: {type: String, required: true},
    expired: {type: Number, required: true}
});

mongoose.model('token', tokenSchema);
