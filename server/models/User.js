import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordSalt: { type: String, default: null },
    passwordHash: { type: String, default: null },
    googleId: { type: String, default: null, index: true },
    avatarUrl: { type: String, default: null },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

export default User;
