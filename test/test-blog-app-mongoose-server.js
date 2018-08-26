'use strict';

// Imports
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker'); // Used to add content to database
const mongoose = require('mongoose');

// this makes the 'expect' syntax available throughout
// this module
const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

// To make HTTP requests in our tests
chai.use(chaiHttp);

// *********DO I NEED FAKER DATA SINCE I HAVE DATA WITH WHICH TO SEED THE DATABASE?
// I think the answer is yes, because the database is destroyed after every test...
// If it is needed, add the 'generate' functions here*********************************

// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure data from one test does not stick
// around for next one
function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}