import jwt from 'jsonwebtoken';

export const generateToken = (id, expiresIn) => {
    const token = jwt.sign({ _id: id }, process.env.JWT_SECRET, { expiresIn });
    return `Bearer ${token}`;
};