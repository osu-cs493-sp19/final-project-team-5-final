const { ObjectId } = require('mongodb');
const { getDBReference } = require('../lib/mongo');
const bcrypt = require('bcryptjs');
const { extractValidFields } = require('../lib/validation');

const CourseSchema = {
    subject: { required: true },
    number: { required: true },
    title: { required: true },
    term: { required: true },
    instructorid: { required: true }
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

  //add empty students and assignments fields to the course.
  await collection.updateOne({_id: result.insertedId}, {$set: { students: [] , assignments: [] }});
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
  const userCollection = db.collection('users');
  const modBus = JSON.parse(JSON.stringify(body));

  //get the add array.
  const addArray = modBus.add;
  const addLength = addArray.length;
  console.log("== addArray: \n", addArray);

  //add students by id in the "add" array.
  for (var i = 0; i < addLength; i++) {

       //UNDER CONSTRUCTION
       //check that the given user id is a student.

       //add the student to the course students array.
       await collection.updateOne({_id: new ObjectId(id)}, {$push: { students: addArray[i] }});

       //add the course to the students courses array.
       await userCollection.updateOne({_id: addArray[i]}, {$push: { courses: id }});

  }

  //get the remove array.
  const remArray = modBus.remove;
  const remLength = remArray.length;
  console.log("== remArray: \n", remArray);

  //UNDER CONSTRUCTION
  //remove students by id in the "remove" array.

  return collection;
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
