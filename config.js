'use strict';
exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/blog-app-mongoose-challenge-solution-production';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/blog-app-mongoose-challenge-solution';
exports.PORT = process.env.PORT || 8080;