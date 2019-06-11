db.users.insertMany([
  {
    "name": "Administrator",
    "email": "admin@tarpaulin.edu",
    "password": "$2a$08$i4ExmXFpm/3MR8oOSVGWWOMGuFHHnrUKHh2s99oRUSwEvne2Ba9Bu",
    "role": "admin",
    "courses": []
  },
  {
    "name": "Instructor A",
    "email": "profa@tarpaulin.edu",
    "password": "$2a$08$bges4MjA5rB35JfoMvUljeeyII3vgiG41nqX/4pEKUs627BxtLQeW",
    "role": "instructor",
    "courses": []
  },
  {
    "name": "Instructor B",
    "email": "profb@tarpaulin.edu",
    "password": "$2a$08$Wxg5ROASgjg1p8.16BsZ8uRI2jMF3ziDeraRhLsS5UrI/ni5rnJ2a",
    "role": "instructor",
    "courses": []
  },
  {
    "name": "Student A",
    "email": "studenta@tarpaulin.edu",
    "password": "$2a$08$ZMIYWZGQx1KWFB4/zJCWv.l0vvmLvoIwASKGJ2Cb66GkfQJGLKvba",
    "role": "student",
    "courses": []
  },
  {
    "name": "Student B",
    "email": "studentb@tarpaulin.edu",
    "password": "$2a$08$ebzWoMHw2/GkI2nMKM2XmOjkqE4mw02Y/IDVYVulTfJHl6gmeE3De",
    "role": "student",
    "courses": []
  }
]);

const uidA = db.users.findOne({name:"Instructor A"})._id;
const uidB = db.users.findOne({name:"Instructor B"})._id;

db.courses.insertMany([
  {
    "subject": "CS",
    "number": "493",
    "title": "Cloud Application Development",
    "term": "sp19",
    "instructorid": uidA,
    "students": [],
    "assignments": []
  },
  {
    "subject": "WR",
    "number": "327",
    "title": "Technical Writing",
    "term": "sp19",
    "instructorid": uidB,
    "students": [],
    "assignments": []
  }
]);

const cidA = db.courses.findOne({subject:"CS", number:"493"})._id;
const cidB = db.courses.findOne({subject:"WR", number:"327"})._id;

db.assignments.insertMany([
  {
    "courseid": cidA,
    "title": "Assignment 2",
    "points": 200,
    "due": new Date().toISOString(),
    "submissions": []
  },
  {
    "courseid": cidB,
    "title": "Final Essay",
    "points": 350,
    "due": new Date().toISOString(),
    "submissions": []
  }
]);

const aidA = db.assignments.findOne({title:"Assignment 2"})._id;
const aidB = db.assignments.findOne({title: "Final Essay"})._id;

db.users.updateOne({name:"Instructor A"}, {$set: { courses: [cidA] }});
db.users.updateOne({name:"Instructor B"}, {$set: { courses: [cidB] }});

db.courses.updateOne({subject:"CS", number:"493"}, {$set: { assignments: [aidA] }});
db.courses.updateOne({subject:"WR", number:"327"}, {$set: { assignments: [aidB] }});
