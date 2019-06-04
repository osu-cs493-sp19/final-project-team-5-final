const router = require('express').Router();

const {
    generateAuthToken,
    requireAuthentication,
    tagRole
  } = require('../lib/auth');

const {
    validateAgainstSchema,
  } = require('../lib/validation');

  const {
    UserScheme,
    getUserById,
	getUserByEmail,
    insertNewUser,
    validateUser
  } = require('../models/users');

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

	console.log("== req.userRole: ", req.userRole);
	
	//confirm that the request body contains a valid user.
	if (validateAgainstSchema(req.body, UserSchema)) {
		
		try {
			//added by middleware tagRole.
			if (req.body.userRole == "admin") {
				
				//adds the new user and then returns the id.
				const id = await insertNewUser(req.body);
				res.status(201).send({
					_id: id
				});

			} else {

				//only admins can create 'admin' or 'instructor' roles.
				if (req.body.role != 'admin' && req.body.role != 'instructor') { 
					
					//adds the new user and then returns the id.
					const id = await insertNewUser(req.body);
					res.status(201).send({
						_id: id
					});

				} else {

					//this user is not allowed to make 'admin' or 'instructor' roles.
					res.status(403).send({
						error: "The request was not made by an authenticated User satisfying the authorization criteria."
					});

				}

			}

		} catch (err) {
			console.error(err);
			res.status(500).send({
				error: "Error inserting new user. Try again later."
			});
		}

	} else {
		res.status(400).send({
			error: "The request body was either not present or did not contain a valid User object."
		});
	}

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

	//make sure that all fields are provided.
	if (req.body && req.body.email && req.body.password) {
	
		try {
			
			//validate user info and get id.
			const user = await getUserByEmail(req.body.email);
			console.log("== user:\n", user);
			
			//if the user exists then attempt to authenticate.
			if(user) {
			
				const authenticated = await validateUser(user._id, req.body.password);
			
				if (authenticated) {
				
					//use our user info to generate a token and return it.
					const token = generateAuthToken(user);
					res.status(200).send({
						token: token
					});
					
				} else {
					res.status(401).send({
						error: "The specified credentials were invalid."
					});
				}	
			
			} else {
				res.status(401).send({
					error: "The specified credentials were invalid.."
				});
			}


		} catch (err) {
			console.error(err);
			res.status(500).send({
				error: "An internal server error occurred."
			});
		}

	} else {
		res.status(400).send({
			error: "The request body was either not present or did not contain all of the required fields."
		});
	}

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

	//only the target user or an admin can access this information.
	console.log("== req.params.id: ", req.params.id);
	console.log("== req.userId: ", req.userId);
	if (req.userRole == "admin" || req.params.id == req.userId) {

		//get user information.
		const user = await getUserById(req.params.id, false);
		
		if (user) {
			
			//if the user is an instructor, return the courses they teach.
			if (user.role == "instructor") {
			
				// UNDER CONSTRUCTION:
				// Return placeholder data for now.
				res.status(200).send({
					subject: "CS",
					number: 493,
					title: "Cloud Application Development",
					term: "sp19",
					instructorId: "123"
				});
			
			}
			
			//if the user is a student, return the courses they are enrolled in.
			if (user.role == "student") {
				
				// UNDER CONSTRUCTION:
				// Return placeholder data for now.
				res.status(200).send({
					subject: "MTH",
					number: 101,
					title: "Basic Math",
					term: "sp19",
					instructorId: "641"
				});
				
			}

			//we get a 404 error if we try to find an admin.
			if (user.role == "admin") {
				res.status(404).send({
					error: "Specified User id not found."
				});
			}

		} else {
			res.status(404).send({
				error: "Specified User id not found."
			});
		}
	
	} else {
		res.status(403).send({
			error: "Not authorized."
		});
	}

});


module.exports = router;
