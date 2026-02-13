module.exports = {
  secret: process.env.JWT_SECRET || 'successpathclasses_fallback_secret',
  expiresIn: process.env.JWT_EXPIRE || '30d',
};
