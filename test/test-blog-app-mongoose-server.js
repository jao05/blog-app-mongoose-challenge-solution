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

describe('Blog API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedBlogData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  //Confirm the following is needed along with the decision to include 'faker' code
  /****************
  beforeEach(function() {
    return seedBlogData();
  });
  ******************************/

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  // Create a nested 'describe' statement for each API CRUD operation
  // GET
  describe('GET endpoint', function() {

    it('should return all existing blog posts', function() {
      // strategy:
      //    1. get back all blogs returned by GET request to `/posts`
      //    2. prove res has right status, data type
      //    3. prove the number of posts we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          // so subsequent .then blocks can access response object
          res = _res;
          expect(res).to.have.status(200);
          // otherwise our db seeding didn't work          
          expect(res.body.posts).to.have.lengthOf.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          
          expect(res.body.posts).to.have.lengthOf(count);
        });
    });


    it('should return blog posts with right fields', function() {
      // Strategy: Get back all blog posts, and ensure they have expected keys

      let resBlogPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          
          expect(res.body.posts).to.be.a('array');
          expect(res.body.posts).to.have.lengthOf.at.least(1);

          res.body.posts.forEach(function(post) {
            expect(post).to.be.a('object');
            expect(post).to.include.keys(
              'title', 'content', 'author');
          });
          resBlogPost = res.body.posts[0];
          return BlogPost.findById(resBlogPost.id);
        })
        .then(function(post) {

          
          expect(resBlogPost.title).to.equal(post.title);
          expect(resBlogPost.content).to.equal(post.content);
          expect(resBlogPost.author).to.equal(post.author);
          
        });
    });
  });

  // POST
  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the blog post we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new blog post', function() {

      const newBlogPost = generateRestaurantData(); //************* another generate consideration...will cause ERROR currently**********     

      return chai.request(app)
        .post('/posts')
        .send(newBlogPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'title', 'content', 'author'); // ***** id here??************
          expect(res.body.title).to.equal(newBlogPost.title);
          // because Mongo should have created id on insertion
          expect(res.body.id).to.not.be.null;
          expect(res.body.content).to.equal(newBlogPost.content);
          expect(res.body.author).to.equal(newBlogPost.author);
          
          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          expect(post.title).to.equal(newBlogPost.title);
          expect(post.content).to.equal(newBlogPost.content);
          expect(post.author).to.equal(newBlogPost.author);          
        });
    });
  });

  // PUT
  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing blog post from db
    //  2. Make a PUT request to update that blog post
    //  3. Prove blog post returned by request contains data we sent
    //  4. Prove blog post in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        title: 'fofofofofofofof',
        content: 'futuristic fusion'
      };

      return BlogPost
        .findOne()
        .then(function(post) {
          updateData.id = post.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return BlogPost.findById(updateData.id);
        })
        .then(function(post) {
          expect(post.title).to.equal(updateData.title);
          expect(post.content).to.equal(updateData.content);
        });
    });
  });

  // DELETE
  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a blog post
    //  2. make a DELETE request for that blog post's id
    //  3. assert that response has right status code
    //  4. prove that blog post with the id doesn't exist in db anymore
    it('delete a blog post by id', function() {

      let blogPost;

      return Restaurant
        .findOne()
        .then(function(_blogPost) {
          blogPost = _blogPost;
          return chai.request(app).delete(`/posts/${blogPost.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(blogPost.id);
        })
        .then(function(_blogPost) {
          expect(_blogPost).to.be.null;
        });
    });
  });

});

  