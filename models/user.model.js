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
},

{timestamps: true});

const User = mongoose.model('User', userSchema);

export default User;