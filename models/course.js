const { ObjectId } = require('mongodb');
const { getDBReference } = require('../lib/mongo');
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
    const courseCollection = db.collection('courses');
    const userCollection = db.collection('users');

    //confirm that the given user is an instructor.
    const user = await getUserById(course.instructorid, false);
    if (!user) {
        console.log("== User", course.instructorid, "is not a valid user.");
        return 0;
    }
    if(user.role != "instructor") {
        console.log("== User", course.instructorid, "is not an instructor.");
        return 0 ;
    } else {
        console.log("== User", course.instructorid, "is an instructor.");
    }

    //add the course to the database.
    const result = await courseCollection.insertOne(courseToInsert);

    //add the course to the instructors courses array.
    const courseid = result.insertedId.toString();
    await userCollection.updateOne({ _id: user._id }, {$push: { courses: courseid }});

    //add empty students and assignments fields to the course.
    await courseCollection.updateOne({_id: result.insertedId}, {$set: { students: [] , assignments: [] }});
    return result.insertedId;
};

/*
 * Modify a Course in the DB.
 */
exports.modifyCourse = async function (id, body) {
    const db = getDBReference();
    const courseCollection = db.collection('courses');
    const userCollection = db.collection('users');
    const modBus = JSON.parse(JSON.stringify(body));

    //if we are changing the instructor then this needs
    //to change the instructors course lists as well.
    if (modBus.hasOwnProperty('instructorid')) {

        console.log("== instructorid is being changed.");

        //confirm that the given user is an instructor.
        const user = await getUserById(modBus.instructorid, false);
        if (!user) {
            console.log("== User", modBus.instructorid, "is not a valid user.");
            return 0;
        }
        if(user.role != "instructor") {
            console.log("== User", modBus.instructorid, "is not an instructor.");
            return 0 ;
        } else {
            console.log("== User", modBus.instructorid, "is an instructor.");
        }

        //remove the course from all instructors.
        await userCollection.updateMany({ role: "instructor" }, {$pull: { courses: id }});

        //add the course to the new instructors courses array.
        await userCollection.updateOne({ _id: user._id }, {$push: { courses: id }});

    } else {
        console.log("== instructorid is unchanged.");
    }

    //update the course.
    return await courseCollection.updateOne({_id: new ObjectId(id)}, {$set: modBus});
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
    for (var i = 0; i < remLength; i++) {

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
    const courseCollection = db.collection('courses');
    const userCollection = db.collection('users');
    const assignmentCollection = db.collection('assignments');

    //get the course.
    if (!ObjectId.isValid(id)) {
        return 0;
    }
    const results = await courseCollection
        .find({ _id: new ObjectId(id) })
        .toArray();

    //if there is not a course then we can't delete it.
    if (results.length < 1) {
        return 0;
    }

    const assnArray = results[0].assignments;

    //remove this course from all student and instructor lists.
    await userCollection.updateMany({}, {$pull: { courses: id }});

    //remove all assignments that are connected to this course.
    await assignmentCollection.deleteMany({ courseid: id });

    //remove the course from the "coures" collection.
    return await courseCollection.deleteOne({ _id: new ObjectId(id) });
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

/*
 * Export CSV file for a specific course that contains student info.
 */
 exports.generateCSV = async function (id) {
    const db = getDBReference();
    const courseCollection = db.collection('courses');
    const userCollection = db.collection('users');

    //get the course information.
    const course = await courseCollection
        .find({ _id: new ObjectId(id) })
        .toArray();

    //get each students info.
    const studentArray = course[0].students;
    const studentLength = studentArray.length;
    var data = [];

    //extract student info one at a time.
    for (var i = 0; i < studentLength; i++) {

        //confirm that the given user is a student.
        const user = await getUserById(studentArray[i], false);
        if (!user) {
            console.log("== User is not a valid user. Ignore this user.");
            continue;
        }
        if(user.role != "student") {
            console.log("== User", user._id, "is not a student. Ignore this user.");
            continue;
        } else {
            console.log("== User", user._id, "is a student.");
        }

        //push the users CSV info to the data array.
        data.push([ user._id.toString(), user.name.toString(), user.email.toString() ]);

    }

    //convert to CSV.
    var csv = "ID,Name,Email\n";
    data.forEach(function(row) {
        csv += row.join(',');
        csv += "\n";
    });

    return csv;
}

 /*
  *  Returns the instructor ID given the course ID
  */
exports.getInstructorIdByCourse = async (id) => {
    const db = getDBReference();
    const collection = db.collection('courses');
    console.log("getInstructorIDByCourse id:"+id);
    const results = await collection.find({ _id: new ObjectId(id) }).toArray();
    return results[0].instructorid;
};

/*
 * Checks if a userId is enrolled in a course
 */
exports.testEnrollmentByCourse = async (cid, uid) => {
    const db = getDBReference();
    const collection = db.collection('courses');
    console.log("testEnrollmentByCourse\nCID: "+ cid + "\nUID:" + uid);
    const results = await collection.find({ _id: new ObjectId(cid), students: new ObjectId(uid) }).toArray();
    if(results.length > 0) {
      return true;
    } else return false;
}

/*
 * Checks is a course exists
 */
exports.courseExists = async(cid) => {
    const db = getDBReference();
    const collection = db.collection('courses');
    const results = await collection.countDocuments({_id: new ObjectId(cid)});
    return (results > 0);
}

/*
 * Adds new assignment to a course
 */
exports.insertAssignmentToCourse = async(cid, aid) => {
    const db = getDBReference();
    const collection = db.collection('courses');
    const results = await collection.updateOne({_id: new ObjectId(cid)}, {$addToSet : {assignments: new ObjectId(aid)}});
    return results;
}

/*
 * Removes an assignment from a course
 */
exports.removeAssignmentFromCourse = async(cid, aid) => {
  const db = getDBReference();
  const collection = db.collection('courses');
  const results = await collection.updateOne({_id: new ObjectId(cid)}, {$pull : {assignments: new ObjectId(aid)}});
  return results;
}
