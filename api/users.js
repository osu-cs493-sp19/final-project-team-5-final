const router = require('express').Router();

const {
    generateAuthToken,
    requireAuthentication,
    tagRole
  } = require('../lib/auth');

/*
    POST /users
    Req:
    {
      "name": "Jane Doe",
      "email": "doej@oregonstate.edu",
      "password": "hunter2",
      "role": "student"
    }

    Res: 
    201: { id: 123 }
    400: { error: The request body was either not present or did not contain a valid User object. }
    403: { error: The request was not made by an authenticated User satisfying the authorization criteria described above. }
*/

//Only authenticated admin can create instructor or admin role users.
router.post('/', tagRole, async (req, res, next) => {

    if(req.userRole == "admin"){} //added by middleware tagRole

});

/* 
    POST /users/login
    Req:
    {
      "email": "jdoe@oregonstate.edu",
      "password": "hunter2"
    }

    Res:
    200: { token: aaaaaaaa.bbbbbbbb.cccccccc }
    400: { error: The request body was either not present or did not contain all of the required fields. }
    401: { error: The specified credentials were invalid. }
    500: { error: An internal server error occurred. }

*/

router.post('/login', async (req, res, next) => {


});

/* 
    GET /users/{id}
    Req:

    Res: (openapi.yaml has incorrect response body for this route. Here is the correct information that's given:)

    Returns information about the specified User.
    If the User has the 'instructor' role, the response should include a list of the IDs of the Courses the User teaches (i.e. Courses whose instructorId field matches the ID of this User).
    If the User has the 'student' role, the response should include a list of the IDs of the Courses the User is enrolled in.
    Only an authenticated User whose ID matches the ID of the requested User can fetch this information.

    200:
    403: not authorized
    404:

*/
router.get('/:id', requireAuthentication, async (req, res, next) => {

});


module.exports = router;