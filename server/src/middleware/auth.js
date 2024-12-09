import jwt from 'jsonwebtoken';

export const authenticateUser = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!token) return null;

    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user;
  } catch (err) {
    return null;
  }
}; 