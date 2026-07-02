import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({

    title:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
    },

    amount:{ 
        type: Number,
        required: [true, 'Please enter an amount'],
        min: 0,
    },

    category: {
        type: String,
        required: true,
        trim: true,
        enum: {
            values: ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Other'],
            message: 'Please enter a valid category'

        }
    },

    date: {
        type: Date,
        required: true,
        default: Date.now,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
},
{timestamps: true});

export default mongoose.model('Expense', expenseSchema);