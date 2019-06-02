const router = require('express').Router();

const { requireAuthentication } = require('../lib/auth');

const {
    AssignmentSchema
  } = require('../models/assignment');

/*
    POST /assignments

    Create and store a new Assignment.
    Only the course instructor or an admin can create assignment

    REQ:
    {
        "courseID": "123",
        "title": "Assignment 3",
        "points": 100,
        "due": "2019-06-14T17:00:00-07:00"
    }

    RES:
    201: { "id": "123" }
    400: req.body not present or did not contain a valid assignment object
    403: not authorized
*/
router.post('/', async (req, res, next) => {

});

/*
    GET /assignments/{id}

    Returns a summary about the assignment, excluding the list of submissions

    REQ:

    RES:
    200:    
    {
        "courseID": "123",
        "title": "Assignment 3",
        "points": 100,
        "due": "2019-06-14T17:00:00-07:00"
    }
    404: assignment id not found.
*/
router.get('/:id', async (req, res, next) => {

});


/* 
    PATCH /assignments/{id}

    Partial update on the data for the assignment, cannot modify submissions via this endpoint.
    Must be authenticated as the course's instructor or an admin.

    REQ:  any fields from above POST route

    RES:
    200
    400: req.body not present or did not contain any related fields.
    403: Not authenticated correctly
    404: assignment id not found
*/
router.patch('/:id', async (req, res, next) => {

});

/*
    DELETE /assignments/{id}
    Removes the data for a specified assignment, including all submissions.
    Must be authenticated as the course's instructor or an admin.

    REQ:

    RES:
    204
    403: Not authenticated correctly
    404: assignment id not found

*/
router.delete('/:id', async (req, res, next) => {

});

/*
    GET /assignments/{id}/submissions
    Returns a list of all the submissions for an assignment.
    Paginated.
    Must be authenticated as the course's instructor, or an admin.

    REQ:
        Query:
            page
            studentid

    RES:
    200: 
    {
        "submissions": 
        [
            {
             "assignmentId": "123",
             "studentId": "123",
             "timestamp": "2019-06-14T17:00:00-07:00",
             "file": "string"
            }
        ]
    }
    403: Not authenticated
    404: assignment id not found
*/
router.get('/:id/submissions', async (req, res, next) => {

});


/*
    POST /assignments/{id}/submissions

    Create and store a new submission with specified data.
    Only an authenticated user with 'student' role who is enrolled in the course can create a submission

    REQ:
    Multi-part form data:
        assignmentId
        studentId
        timestamp (string($date-time))
        file (binary data)

    RES:
    201: { id: "123" }
    400: Invalid submission object
    403: User not authenticated correctly
    404: Assignment id not found
*/
router.post('/:id/submissions', async (req, res, next) => {

});

module.exports = router;