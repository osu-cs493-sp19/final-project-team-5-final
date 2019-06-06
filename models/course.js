const { ObjectId } = require('mongodb');
const { getDBReference } = require('../lib/mongo');
const bcrypt = require('bcryptjs');
const { extractValidFields } = require('../lib/validation');
const { getUserById } = require('./users');

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
 * Modify student enrollment for a Course in the DB.
 */
exports.modifyEnrollment = async function (id, body) {
  const db = getDBReference();
  const courseCollection = db.collection('courses');
  const userCollection = db.collection('users');
  const modBus = JSON.parse(JSON.stringify(body));

  //get the add array.
  const addArray = modBus.add;
  const addLength = addArray.length;

  //add students by id in the "add" array.
  for (var i = 0; i < addLength; i++) {

     console.log("== new ObjectId(id): ", new ObjectId(id));
     console.log("== addArray[i]: ", addArray[i]);

     //confirm that the given user is a student.
     const user = await getUserById(addArray[i], false);
     if (!user) {
          console.log("== User", addArray[i], "is not a valid user. Ignore this user.");
          continue;
     }
     if(user.role != "student") {
       console.log("== User", user._id, "is not a student. Ignore this user.");
       continue;
     } else {
       console.log("== User", user._id, "is a student.");
     }

     //remove duplicate instances from the course students array.
     await courseCollection.updateOne({_id: new ObjectId(id)}, {$pull: { students: addArray[i] }});

     //add the student to the course students array.
     await courseCollection.updateOne({ _id: new ObjectId(id) }, {$push: { students: addArray[i] }});

     //remove duplicate instances from the students courses array.
     await userCollection.updateOne({ _id: user._id }, {$pull: { courses: id }});

     //add the course to the students courses array.
     await userCollection.updateOne({ _id: user._id }, {$push: { courses: id }});

  }

  //get the remove array.
  const remArray = modBus.remove;
  const remLength = remArray.length;

  //remove students by id in the "remove" array.
  for (var i = 0; i < addLength; i++) {

     //confirm that the given user is a student.
     const user = await getUserById(remArray[i], false);
     if (!user) {
           console.log("== User", remArray[i], "is not a valid user. Ignore this user.");
           continue;
     }
     if(user.role != "student") {
        console.log("== User", user._id, "is not a student. Ignore this user.");
        continue;
     } else {
        console.log("== User", user._id, "is a student.");
     }

     //remove the student from the course students array.
     await courseCollection.updateOne({ _id: new ObjectId(id) }, {$pull: { students: remArray[i] }});

     //remove the course from the students courses array.
     await userCollection.updateOne({ _id: user._id }, {$pull: { courses: id }});

  }

  return true;
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
async function getCourseById(id, includeRelations) {
  const db = getDBReference();
  const collection = db.collection('courses');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const projection = includeRelations ? {} : { students: 0 , assignments: 0 };
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .project(projection)
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
    .project({ students: 0 , assignments: 0 })
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
