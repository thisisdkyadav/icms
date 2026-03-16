// Authentication middleware
// TODO: Implement JWT authentication

export const authMiddleware = (req, res, next) => {
  // TODO: Check for JWT token
  // TODO: Verify token
  // TODO: Add user to request object
  next();
};

export const superAdminOnly = (req, res, next) => {
  // TODO: Check if user is super admin
  next();
};
