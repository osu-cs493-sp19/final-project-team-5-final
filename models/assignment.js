const { ObjectId } = require('mongodb');
const { getDBReference } = require('../lib/mongo');
const bcrypt = require('bcryptjs');
const { extractValidFields } = require('../lib/validation');

const AssignmentSchema = {
    courseid: { required: true },
    title: { required: true },
    points: { required: true },
    due: { require: true }
};
exports.AssignmentSchema = AssignmentSchema;
