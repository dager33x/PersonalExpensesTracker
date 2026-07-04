import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    name: { type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50,

    },

    email: { type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },

    password: { type: String,
        required: [true, 'Please enter a password'],
        minlength: 6,
    },

    sex: {
        type: String,
        required: true,
        enum: ["male", "female"],
    },

    emailVerified: {
        type: Boolean,
        default: false,
        alias: "verifyEmail",
    },

    emailVerificationToken: {
        type: String,
        default: null,
    },

    emailVerificationExpires: {
        type: Date,
        default: null,
    },

    passwordResetToken: {
        type: String,
        default: null,
    },

    passwordResetExpires: {
        type: Date,
        default: null,
    },

    avatarUrl: {
        type: String,
        default: null,
    },

    budgetGoals: {
        monthlyTotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        categories: {
            type: Map,
            of: Number,
            default: {},
        },
    },

    walletBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
},

{timestamps: true});

const User = mongoose.model('User', userSchema);

export default User;
