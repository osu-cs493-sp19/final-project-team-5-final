const router = require('express').Router();

const { validateAgainstSchema } = require('../lib/validation');
const { requireAuthentication, tagRole } = require('../lib/auth');
const {
    CourseSchema,
    insertNewCourse
  } = require('../models/course');

/*
    GET /courses

    REQ:
      Query options:
        page=3
        subject=CS
        number=493
        term=sp19

    RES: (yaml says submissions, I replaced it with courses)
    {
        "courses": 
        [
            {
                "subject": "CS",
                "number": 493,
                "title": "Cloud Application Development",
                "term": "sp19",
                "instructorId": "123"
            }
        ]
    }

 */

router.get('/', async (req, res, next) => {

});


/* 
    POST /courses

    Must be authenticated as admin to create a course

    REQ:
    {
        "subject": "CS",
        "number": 493,
        "title": "Cloud Application Development",
        "term": "sp19",
        "instructorId": "123"
    }
    RES:
    201 { "id": "123" }
    400 { error: The request body was either not present or did not contain a valid Course object. }
    403 Not authorized
    
*/
router.post('/', tagRole, async (req, res, next) => {

	//only admins can post new courses.
	if (req.body.userRole == "admin") {
		
		//confirm that the request body contains a valid course.
		if (validateAgainstSchema(req.body, CourseSchema)) {
		
			try {
				
				//adds the new course and then returns the id.
				const id = await insertNewCourse(req.body); 
				res.status(201).send({
					_id: id
				});

			} catch (err) {
				res.status(500).send({
					error: "Error inserting new course. Try again later."
				});
			}
		
		} else {
			res.status(400).send({
				error: "The request body was either not present or did not contain a valid Course object."
			});
		}

	} else {
		res.status(403).send({
			error: "The request was not made by an authenticated User statisfying the authorization criteria."
		});
	}

});

/*
    GET /courses/{id}

    Returns summary data about a specified course, excludes enrolled students and assignments

    REQ:

    RES:
    200
    {
        "subject": "CS",
        "number": 493,
        "title": "Cloud Application Development",
        "term": "sp19",
        "instructorId": "123"
    }

    404: Specified course {id} not found.
*/

router.get('/:id', async (req, res, next) => {

});
/*
    PATCH /courses/{id}

    Perform a partial update for the course. Cannot modifiy students or assignments
    Must be authenticated as the instructor for this course, or an admin.

    REQ: See req.body for Post route, none are required due to it being a patch request (I believe)

    RES: 
    200
    400: body not present, or did not contain any fields related to Course objects
    403: user not authenticated
    404: course id not found

*/
router.patch('/:id', async (req, res, next) => {

});

/*
    DELETE /courses/{id}

    Fully removes a course, including student enrollment, and assignments.
    Must be authenticated as admin.

    REQ:

    RES:
    204
    403: Improper authentication
    404: course id not found

*/
router.delete('/:id', async (req, res, next) => {

});

/*
    GET /courses/{id}/students

    Fetch a list of students enrolled in the Course
    Must be authenticated as admin or instructor for the course.

    REQ:

    RES:
    200: { "students": ["123", "456"] }
    403: Invalid authentication
    404: Course not found
*/
router.get('/:id/students', async (req, res, next) => {

});


/* 
    POST /courses/{id}/students

    Add/remove students from a course.
    Must be authenticated as the instructor for the course, or an admin.

    REQ: { "add": [ "123", "456" ], "remove": [ "234", "345" ] }

    200
    400: req.body not present, or fields as described.
    403: not authenticated properly
    404: course not found
*/
router.post('/:id/students', async (req, res, next) => {

});

/* 
    GET /courses/{id}/roster

    Returns a CSV file containing info about enrolled students: names, IDs, emails.
    Must be the instructor for the course, or admin.

    REQ:

    RES:
    200:   123,"Jane Doe",doej@oregonstate.edu
           ...
    403: Not authenticated
    404: Course not found

*/
router.get('/:id/roster', async (req, res, next) => {

});


/*
    GET /courses/{id}/assignments

    Returns a list containing the assignment IDs for all assignments in a course

    REQ:

    RES:
    200: { "assignments": ["123", "456"] } 
    404: Course id not found
*/
router.get('/:id/assignments', async (req, res, next) => {

});

module.exports = router;
