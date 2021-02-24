let mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

const defaultGreetingText = (process.env.DEFAULT_GREETING_TEXT) ? process.env.DEFAULT_GREETING_TEXT : 'Welcome';
const defaultThanksText = (process.env.DEFAULT_THANKS_TEXT) ? process.env.DEFAULT_THANKS_TEXT : 'Glad to meet';

const uploadSchema = mongoose.Schema({
    userId: {type: String, required: true},
    greetingText: {type: String, default: defaultGreetingText},
    thanksText: {type: String, default: defaultThanksText},
    template: {type: String, required: true},
    link: {type: String, default: 'empty'},
    expired: {type: Number, required: true},
});

mongoose.model('upload', uploadSchema);
