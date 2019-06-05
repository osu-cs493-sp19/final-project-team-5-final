const { ObjectId } = require('mongodb');
const { getDBReference } = require('../lib/mongo');
const bcrypt = require('bcryptjs');
const { extractValidFields } = require('../lib/validation');

const CourseSchema = {
    subject: { required: true },
    number: { required: true },
    title: { required: true },
    term: { required: true },
    instructorid: { require: true }
};
exports.CourseSchema = CourseSchema;

/*
 * Insert a new Course into the DB.
 */
exports.insertNewCourse = async function (course) {
  const courseToInsert = extractValidFields(course, CourseSchema);
  const db = getDBReference();
  const collection = db.collection('courses');
  const result = await collection.insertOne(courseToInsert);
  return result.insertedId;
};

/*
 * Fetch a Course from the DB based on Course ID.
 */
async function getCourseById(id, includeStudents, includeAssignments) {
  const db = getDBReference();
  const collection = db.collection('courses');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    //const projectionStudents = includeStudents ? {} : { students: 0 };
	//const projectionAssignments = includeAssignments ? {} : { assignments: 0 };
    const results = await collection
      .find({ _id: new ObjectId(id) })
      //.project(projectionStudents)
	  //.project(projectionAssignments)
      .toArray();
    return results[0];
  }
};
exports.getCourseById = getCourseById;