const mongoose = require('mongoose');
const subscriptionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionObject: { type: Object, required: true }
});
module.exports = mongoose.model('Subscription', subscriptionSchema);