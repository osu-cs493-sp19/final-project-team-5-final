const fs = require('fs');
const { ObjectId, GridFSBucket } = require('mongodb');
const { getDBReference } = require('../lib/mongo');
const bcrypt = require('bcryptjs');
const { extractValidFields } = require('../lib/validation');

const { 
    getInstructorIdByCourse,
    testEnrollmentByCourse
    } = require('./course');

const AssignmentSchema = {
    courseid: { required: true },
    title: { required: true },
    points: { required: true },
    due: { require: true }
};
exports.AssignmentSchema = AssignmentSchema;

/*
 * Fetch a Course from the DB based on Course ID.
 */
async function getAssignmentById(id, includeRelations) {
    const db = getDBReference();
    const collection = db.collection('assignments');
      const projection = includeRelations ? {} : { submissions: 0 };
      const results = await collection
        .find({ _id: new ObjectId(id) })
        .project(projection)
        .toArray();

      return results[0];
} exports.getAssignmentById = getAssignmentById;

/*
 *  Returns the instructorId for a course, given an assignmentId.
 */

async function getInstructorIdByAssignment(id) {
    const db = getDBReference();
    const collection = db.collection('assignments');
    console.log("getInstructorIDByAssignment id:"+id);
    const results = await collection.find({ _id : new ObjectId(id) }).toArray();
    const result = await getInstructorIdByCourse(results[0].courseid);
    const instructorId = result.toString();
    return instructorId.toString();
} exports.getInstructorIdByAssignment = getInstructorIdByAssignment;

/*
 *  When given an assignmentId and a userId, will return a bool indicating enrollment in
 *  the course which the assignment was given.
 */

async function testEnrollmentByAssignment(aid, uid) {
    const db = getDBReference();
    const collection = db.collection('assignments');
    const results = await collection.find({ _id: new ObjectId(aid) }).toArray();
    if(results[0]) {
        const courseId = results[0].courseid.toString();
        return await testEnrollmentByCourse(courseid, uid);
    } else {
        return false;
    }
} exports.testEnrollmentByAssignment = testEnrollmentByAssignment;

/*
 *  Creates a whole page of submission pages based on fields stored in query:
 *  assignmentId, studentId (If one is specified), and a page. Pagination and
 *  self contained formatting.
 */

async function getSubmissionPage(query) {
    const db = getDBReference();
    const assignmentCollection = db.collection('assignments');
    const submissionCollection = db.collection('submissions.files');
    const targetAssignment = assignmentCollection.find({ _id: new ObjectId(query.assignmentId)}).toArray();
    const submissionList = targetAssignment[0].metadata.submissions;

    var searchList = [];
    submissionList.forEach(submissionId => { 
        searchList.push(new ObjectId(submissionId)); 
    });

    const search = { _id: {$in: searchList}};
    if(query.studentId) search['metadata.studentId'] = new ObjectId(query.studentId);

    const pageSize = 5;
    var numSubs = await submissionCollection.countDocuments(search);
    var pages = Math.max(Math.ceil (numSubs / pageSize), 1);
    var offset = (query.page - 1) * pageSize;

    const allSubs = await submissionCollection
      .find(search)
      .sort({ _id: 1})
      .skip(offset)
      .limit(pageSize)
      .toArray();
      var results = [];
      allSubs.forEach(sub=> {
          results.push({
              assignmentid: sub.metadata.assignmentid,
              studentid: sub.metadata.studentid,
              timestamp: sub.timestamp,
              file: "/uploads/"+sub.filename
          });
      });
    const url = "/assignments/"+query.assignmentid+"/submissions"+(query.studentid ? "?studentid="+query.studentid : "")+"?page=";
    return {
        submissions: results,
        results: numSubs,
        page: query.page,
        totalpages: pages,
        first: url+"1",
        next: url+Math.min(page+1,pages).toString(),
        last: url+pages.toString()
    };
} exports.getSubmissionPage = getSubmissionPage;

function insertNewSubmission(newUpload) {
    return new Promise((resolve, reject) => {
        const db = getDBReference();
        const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
    
        const metadata = {
            contentType: newUpload.contentType,
            assignmentid: newUpload.assignmentid,
            studentid: newUpload.studentid
        };
    
        const uploadStream = bucket.openUploadStream(
            newUpload.filename,
            {
                metadata: metadata
            }
        );
    
        fs.createReadStream(newUpload.path)
          .pipe(uploadStream)
          .on('error', (err) => {
              reject(err);
          })
          .on('finish', (result) => {
              resolve(result._id);
          });
    });
} exports.insertNewSubmission = insertNewSubmission;

exports.getDownloadStreamByFilename = function (filename) {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
    return bucket.openDownloadStreamByName(filename);
};

exports.insertNewAssignment = async(assn) => {
    const db = getDBReference();
    const collection = db.collection('assignments');
    const result = await collection.insertOne( assn );
    return result.insertedId;
};

exports.updateAssignment = async(aid, assn) => {
    const db = getDBReference();
    const collection = db.collection('assignments');
    const result = await collection.updateOne({_id: new ObjectId(aid)}, { $set: assn });
    return result.insertedId;
};

 async function getSubmissionsByAssignment(aid) {
    const db = getDBReference();
    const collection = db.collection('assignments');
    const results = await collection.find({ _id: new ObjectId(aid) });
    return results[0].submissions;
} exports.getSubmissionsByAssignment = getSubmissionsByAssignment;

exports.removeSubmissionById = (sid) => {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
    return bucket.delete(new ObjectId(sid));
};

exports.removeAssignment = async(aid) => {
    console.log("removeAssignment aid:"+aid);
    const db = getDBReference();
    const collection = db.collection('assignments');
    const submissions = await getSubmissionsByAssignment(aid);
    submissions.forEach( sid => {
        removeSubmissionById(sid)
    });
    const result = await collection.deleteOne({_id: new ObjectId(aid)});
    return result.deletedCount;
}

exports.assignmentExists = async(aid) => {
    const db = getDBReference();
    const collection = db.collection('assignments');
    const results = await collection.countDocuments({_id: new ObjectId(aid)});
    return (results > 0);
}