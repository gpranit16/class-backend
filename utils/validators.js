const validator = require('validator');

exports.validateEmail = (email) => {
  return validator.isEmail(email);
};

exports.validatePhone = (phone) => {
  return /^[0-9]{10}$/.test(phone);
};

exports.validatePassword = (password) => {
  return password && password.length >= 6;
};

exports.sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(validator.trim(input));
  }
  return input;
};
