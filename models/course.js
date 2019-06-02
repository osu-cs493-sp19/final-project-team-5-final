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