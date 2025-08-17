const mongoose = require('mongoose');

const engineerSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eng_code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    commission: {
        type: Number,
        default: 0
    },
    skill_level: {
        type: String,
        required: true
    },
    current_status: {
        type: String,
        enum: ['available', 'busy', 'offline'],
        default: 'available'
    },
    over_time: {
        type: Boolean,
        default: false
    },
    latest_location_date: {
        type: Date
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    address_line1: {
        type: String
    },
    address_line2: {
        type: String
    },
    address_line3: {
        type: String
    },
    address_line4: {
        type: String
    },
    postcode: {
        type: String
    }
}, { timestamps: true });

const Engineer = mongoose.model('Engineer', engineerSchema);
module.exports = Engineer ;