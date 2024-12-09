export const validateRegistration = ({ username, email, password }) => {
  const errors = {};

  if (username.trim() === '') {
    errors.username = 'Username must not be empty';
  }

  if (email.trim() === '') {
    errors.email = 'Email must not be empty';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Email must be a valid email address';
    }
  }

  if (password === '') {
    errors.password = 'Password must not be empty';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};

export const validateLogin = ({ email, password }) => {
  const errors = {};

  if (email.trim() === '') {
    errors.email = 'Email must not be empty';
  }
  if (password === '') {
    errors.password = 'Password must not be empty';
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
}; 