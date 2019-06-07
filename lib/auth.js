/*
 * Auth stuff.
 */

const jwt = require('jsonwebtoken');

const secretKey = 'SuperSecret!';

exports.generateAuthToken = function (user) {
  const payload = {
    sub: user.email,
    id: user._id,
    role: user.role
  };
  console.log(payload);
  const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });
  return token;
};

exports.requireAuthentication = function (req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const authHeaderParts = authHeader.split(' ');
  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

  try {

    const payload = jwt.verify(token, secretKey);
    req.userEmail = payload.sub;
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
  } catch (err) {
    console.error("  -- error:", err);
    res.status(401).send({
      error: "Invalid authentication token provided."
    });
  }
};

/*
 * Use as middleware for routes that give functionality depending on role, but do not require authentication.
 * Puts authenticated role string in req.userRole
 * Could be modified to add more authenticated information to req, as needed.
 */

exports.tagRole = function(req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const authHeaderParts = authHeader.split(' ');
  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

  try {

    const payload = jwt.verify(token, secretKey);
	req.userRole = payload.role;

  } catch (err) {
    //even if we aren't authenticating we need to to set a userRole.
	//by default users should be "none" to prevent special permissions.
	req.userRole = "none";
  }

  next();
}
