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
 * Modify a Course in the DB.
 */
exports.modifyCourse = async function (id, body) {
  const db = getDBReference();
  const collection = db.collection('courses');
  const modBus = JSON.parse(JSON.stringify(body));
  return await collection.updateOne({_id: new ObjectId(id)}, {$set: modBus});
};

/*
 * Modify a student enrollment for a Course in the DB.
 */
exports.modifyEnrollment = async function (id, body) {
  const db = getDBReference();
  const collection = db.collection('courses');
  const modBus = JSON.parse(JSON.stringify(body));
  //remove students by id in the "remove" array.
  //add students by in the "add" array.
  //return await collection.updateOne({_id: new ObjectId(id)}, {$set: modBus});
};

/*
 * Delete a Course from the DB.
 */
exports.deleteCourseByID = async function (id) {
  const db = getDBReference();
  const collection = db.collection('courses');
  return await collection.deleteOne({_id: new ObjectId(id)});
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

/*
 * Get specific page of courses.
 */
exports.getCoursesPage = async function (page, pageSize) {
    const db = getDBReference();
    const collection = db.collection('courses');
    var numResults = await collection.countDocuments();
    var pages = Math.max(Math.ceil (numResults / pageSize),1);
    var offset = (page - 1) * pageSize;
    var queryResults = await collection.find({})
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();
    return {
        courses: queryResults,
        results: numResults,
        page: page,
        totalpages: pages,
        first: "/courses?page=1",
        next: "/courses?page="+Math.min(page+1,pages).toString(),
        last: "/courses?page="+pages.toString()
    };
}
