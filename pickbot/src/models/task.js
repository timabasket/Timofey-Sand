const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

const taskSchema = mongoose.Schema({
    userId: {type: String, required: true},
    status: {type: String, required: true, default: "new"}, // new, inprogress, success, error
    resExt: {type: String, required: true, default: ".mp4"}, // result file extention
    createdAt: {type: Number, required: true, default: Date.now()},
    finishedAt: {type: Number, required: true, default: -1}
});

mongoose.model('task', taskSchema);