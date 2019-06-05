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