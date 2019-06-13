const router = require('express').Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { requireAuthentication } = require('../lib/auth');

const { 
    validateAgainstSchema, 
    validateAgainstSchemaPatch,
    extractValidFields 
  } = require('../lib/validation')

const {
    AssignmentSchema,
    getAssignmentById,
    getInstructorIdByAssignment,
    getSubmissionPage,
    testEnrollmentByAssignment,
    insertNewAssignment,
    updateAssignment,
    assignmentExists,
    removeAssignment,
    insertNewSubmission
  } = require('../models/assignment');

const { 
    testEnrollmentByCourse, 
    getInstructorIdByCourse,
    courseExists
  } = require('../models/course');

const upload = multer({
    storage: multer.diskStorage({
      destination: `${__dirname}/uploads`,
      filename: (req, file, callback) => {
        const basename = crypto.pseudoRandomBytes(16).toString('hex');
        const extension = path.extname(file.originalname);
        callback(null, `${basename}${extension}`);
      }
    })
});

function removeUploadedFile(file) {
    return new Promise((resolve, reject) => {
      fs.unlink(file.path, (err) => {
        if(err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
}

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
router.post('/', requireAuthentication, async (req, res, next) => {
    var instructorId = null;
    try{
        instructorId = await getInstructorIdByCourse(req.body.courseid);
    } catch (err) { next(err) }; //500
    if(req.userRole == "admin" || (req.userRole == "instructor" && req.userId == instructorId) ){
        if(validateAgainstSchema(req.body, AssignmentSchema)){
            const validAssn = extractValidFields(req.body, AssignmentSchema);
            try{
                const id = await insertNewAssignment(validAssn);
                res.status(201).send({
                    id: id
                });
            } catch (err) { next(err); } //500
        } else {
            res.status(400).send({
                error: "The request body was either not present or did not contain a valid Assignment object."
            });
        }
    } else {
        res.status(403).send({
            error: "User is not authorized to perform this action"
        });
    }
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
    var exists = null;
    var assignment = null;
    try{
        exists = await assignmentExists(req.params.id);
        assignment = await getAssignmentById(req.params.id, false);
    } catch (err) { next(err); } //500
    if(exists){
        res.status(200).send(assignment);
    } else { next(); } //404
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
router.patch('/:id', requireAuthentication, async (req, res, next) => {
    var instructorId;
    try{
        const exists = await assignmentExists(req.params.id);
        if(exists) {
            instructorId = await getInstructorIdByAssignment(req.params.id);
        } else { next(); } //404
    } catch (err) { next(err); } //500

    if(req.userRole == "admin" || (req.userRole == "instructor" && req.userId == instructorId) ){
        if(validateAgainstSchemaPatch(req.body, AssignmentSchema)){
            const validAssn = extractValidFields(req.body, AssignmentSchema);
            try{
                const id = await updateAssignment(validAssn, req.params.id);
                res.status(200).send({
                    id: id
                });
            } catch (err) { next(err); } //500
        } else {
            res.status(400).send({
                error: "The request body was either not present or did not contain a valid Assignment object."
            });
        }
    } else {
        res.status(403).send({
            error: "User is not authorized to perform this action"
        });
    }
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
router.delete('/:id', requireAuthentication, async (req, res, next) => {
    var instructorId = null;
    try{
        const exists = await assignmentExists(req.params.id);
        if(exists) {
            instructorId = await getInstructorIdByAssignment(req.params.id);
        } else { next(); } //404
    } catch (err) { next(err); } //500

    if(req.userRole == "admin" || (req.userRole == "instructor" && req.userId == instructorId) ){
        try{
            const result = await removeAssignment(req.params.id);
            res.status(204).send();
        } catch (err) { next(err); } //500
    } else {
        res.status(403).send({
            error: "User is not authorized to perform this action"
        });
    }
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
router.get('/:id/submissions', requireAuthentication, async (req, res, next) => {
    var instructorId = null;
    try{
        const exists = await assignmentExists(req.params.id);
        if(exists) {
            instructorId = await getInstructorIdByAssignment(req.params.id);
        } else { next(); } //404
    } catch (err) { next(err); } //500
    if(req.userRole == "admin" || req.userId == instructorId) {
        const submissionQuery = {};
        submissionQuery.assignmentid = req.params.id;
        submissionQuery.studentid = req.query.studentid || null;
        submissionQuery.page = req.query.page || 1;
        try{
            const resultPage = await getSubmissionPage(submissionQuery);
            res.status(200).send({ resultPage });
        } catch (err) { next(err); } //500
    } else {
        res.status(403).send({
            error: "User is not authenticated to access this resource"
        });
    }
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
router.post('/:id/submissions', requireAuthentication, upload.single('file'), async (req, res, next) => {
    if(req.userRole == "student" && req.body.studentid && req.userId == req.body.studentid){
        try {
            const enrolled = await testEnrollmentByAssignment(req.body.assignmentid, req.body.studentid);
            console.log("enrolled: "+enrolled+"\n req.file: "+JSON.stringify(req.file)+"\n req.body: "+JSON.stringify(req.body), +"\n req.params:"+JSON.stringify(req.params));
            if(enrolled && req.file && req.body && req.body.assignmentid && req.body.assignmentid == req.params.id){
                const newUpload = {
                    path: req.file.path,
                    filename: req.file.filename,
                    contentType: req.file.mimetype,
                    assignmentid: req.body.assignmentid,
                    studentid: req.body.studentid
                };
                const id = await insertNewSubmission(newUpload);
                removeUploadedFile(newUpload);
                res.status(201).send({
                    id: id
                });
            } else {
                res.status(400).send({
                    error: "Request body is not a valid submission object"
                });
            }
        } catch (err) {
            next(err); // 500
        }
    } else {
        res.status(403).send({
            error: "User is not authorized to create a submission here."
        });
    }
});

module.exports = router;