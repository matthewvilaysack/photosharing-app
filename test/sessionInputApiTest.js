"use strict";

/**
 * Mocha test of CS142 Project 7 web server session and input API. Run using
 * this command:
 *   node_modules/.bin/mocha sessionInputApiTest.js
 */

const assert = require("assert");
const _ = require("lodash");
const fs = require("fs");
const axios = require("axios");
const FormData = require('form-data');


const port = 3000;
const host = "127.0.0.1";

function makeFullUrl(url) {
  return "http://" + host + ":" + port + url;
}

function assertEqualDates(d1, d2) {
  return new Date(d1).valueOf() === new Date(d2).valueOf();
}
/**
 * MongoDB automatically adds some properties to our models. We allow these to
 * appear by removing them when before checking for invalid properties. This way
 * the models are permitted but not required to have these properties.
 */
function removeMongoProperties(model) {
  const copy = JSON.parse(JSON.stringify(model));
  delete copy._id;
  delete copy.__v;
  return copy;
}

describe("CS142 Photo App: Session and Input API Tests", function () {
  let sessionCookie;
  describe("test /admin/login and /admin/logout", function (done) {
    it("errors getting the list of user if not logged in", function (done) {
      axios.get(makeFullUrl("/user/list")).then(function (response) {
        assert.fail("Expected error not received");
      }).catch(function (error) {
        assert.strictEqual(
          error.response.status,
          401,
          "HTTP response status code 401"
        );
        done();
      });
    });

    it("errors getting user detail if not logged in", function (done) {
      axios.get(makeFullUrl("/user/1")).then(function (response) {
        assert.fail("Expected error not received");
      }).catch(function (error) {
        assert.strictEqual(
          error.response.status,
          401,
          "HTTP response status code 401"
        );
        done();
      });
    });

    it("errors getting the list of photos if not logged in", function (done) {
      axios.get(makeFullUrl("/photosOfUser/1")).then(function (response) {
        assert.fail("Expected error not received");
      }).catch(function (error) {
        assert.strictEqual( 
          error.response.status,
          401,
          "HTTP response status code 401"
        ); 
        done();
      });
    });

    it("rejects logins to non-existent login_name", function (done) {
      axios
        .post(makeFullUrl("/admin/login"), {
          login_name: "notValid",
        })
        .then(function (response) {
          assert.fail("Expected error not received");
        })
        .catch(function (error) {
          assert.strictEqual(
            error.response.status,
            400,
            "HTTP response status code 400"
          );
          done();
        });
    });

    it("rejects logins to existing login_name with wrong password", function (done) {
      axios
        .post(makeFullUrl("/admin/login"), {
          login_name: "took",
          password: "wrong",
        })
        .then(function (response) {
          assert.fail("Expected error not received");
        })
        .catch(function (error) {
          assert.strictEqual(
            error.response.status,
            400,
            "HTTP response status code 400"
          );
          done();
        });
    });
    it("accepts logins to existing login_name with correct password", function (done) {
      axios
        .post(makeFullUrl("/admin/login"), {
          login_name: "took",
          password: "weak",
        })
        .then(function (response) {
          assert.strictEqual(
            response.status,
            200,
            "HTTP response status code 200"
          );
          sessionCookie = response.headers['set-cookie'][0];
          assert.ok(sessionCookie, 'Session cookie found')
          done();
        })
        .catch(function (error) {
          assert.fail("Unexpected error received");
        });
    });
  
    it("can get user list when logged in", function (done) {
      axios.get(makeFullUrl("/user/list"), {
        headers: {
          Cookie: sessionCookie // use the session cookie from the previous test
        }
      }).then(function (response) {
        assert.strictEqual(
          response.status,
          200,
          "HTTP response status code 200"
        );
        done();
      }).catch(function (error) {
        assert.fail("Unexpected error received");
      });
    });

    it("can logout when logged in", function (done) {

      axios.post(makeFullUrl("/admin/logout"),{},  {
            headers: {
              Cookie: sessionCookie // use the session cookie from the previous test
            }
        }).then(function (response) {
          assert.strictEqual(
            response.status,
            200,
            "HTTP response status code 200"
         );
         done();
      }).catch(function (error) {
        assert.fail("Unexpected error received");
      });
    });

  });

  describe("test /commentsOfPhoto/id", function (done) {
    let user_id;
    let photos, photos2;
    const newCommentText = "this is a new comment";
    let photo_id;
    let originalPhoto;
    let sessionCookie;


    it("can login as took and get id", function (done) {
      axios
        .post(makeFullUrl("/admin/login"), {
          login_name: "took",
          password: "weak",
        })
        .then(function (response) {
          sessionCookie = response.headers['set-cookie'][0];
          assert.ok(sessionCookie, 'Session cookie found')
          assert.strictEqual(response.status, 200, "HTTP response status code 200");
          assert.ok(response.data._id, "Login response body contains user's _id");
          user_id = response.data._id;
          done();
        })
        .catch(function (error) {
          assert.fail("Unexpected error received");
        });
    });

    it("can get tooks photos", function (done) {
      axios.get(makeFullUrl("/photosOfUser/" + user_id), {
            headers: {
              Cookie: sessionCookie // use the session cookie from the previous test
            }
      }).then(function (response) {
        assert.strictEqual(
          response.status,
          200,
          "HTTP response status code 200"
        );
        photos = response.data;
        done();
      }).catch(function (error) {
        assert.fail("Unexpected error received");
      });
    });

    it("can add a comment to the the first photo", function (done) {
      originalPhoto = photos[0];
      photo_id = originalPhoto._id;
      axios
        .post(makeFullUrl("/commentsOfPhoto/" + photo_id), {
          comment: newCommentText,
        }, {
          headers: {
            Cookie: sessionCookie // use the session cookie from the previous test
          }
        }).then(function (response) {
          assert.strictEqual(
            response.status,
            200,
            "HTTP response status code 200"
          );  
          done();
        })
        .catch(function (error) { 
          assert.fail("Unexpected error received");
        });
    });

    it("can get tooks photos again", function (done) {
      axios.get(makeFullUrl("/photosOfUser/" + user_id), {
          headers: {
            Cookie: sessionCookie // use the session cookie from the previous test
          }
      }).then(function (response) {
        assert.strictEqual(
          response.status,
          200,
          "HTTP response status code 200"
        );
        photos2 = response.data;
        done();
      }).catch(function (error) {
        assert.fail("Unexpected error received");
      });
    });


    it("photo has one more comment", function (done) {
      const newPhoto = _.find(photos2, { _id: photo_id });
      assert(newPhoto, "Can not find photo");
      assert.strictEqual(
        newPhoto.comments.length,
        originalPhoto.comments.length + 1
      );
      done();
    });

    it("can logout when logged in", function (done) {
      axios.post(makeFullUrl("/admin/logout"), {}, {
        headers: {
          Cookie: sessionCookie // use the session cookie from the previous test
        }
      }).then(function (response) {
        assert.strictEqual(
          response.status,
          200,
          "HTTP response status code 200"
        );
        done();
      }).catch(function (error) {
        assert.fail("Unexpected error received");
      });
    });
  });


  describe("upload photos -  post /photos/new", function (done) {
    let user_id;
    const uniquePhotoName = "p" + String(new Date().valueOf()) + ".jpg";
    let sessionCookie;

    it("can login as took and get id", function (done) {
      axios
        .post(makeFullUrl("/admin/login"), {
          login_name: "took",
          password: "weak",
        })
        .then(function (response) {
          sessionCookie = response.headers['set-cookie'][0];
          assert.ok(sessionCookie, 'Session cookie found')
          assert.strictEqual(response.status, 200, "HTTP response status code 200");
          assert.ok(response.data._id, "Login response body contains user's _id");
          user_id = response.data._id;
          done();
        })
        .catch(function (error) {
          assert.fail("Unexpected error received");
        });
    });

    it("can upload a photo", function (done) {
      const form = new FormData();
      form.append('uploadedphoto', fs.createReadStream(__dirname + "/testPhoto.jpg"), {
        filename: uniquePhotoName,
        contentType: "image/jpg",
      });
    
      axios.post(makeFullUrl("/photos/new"), form, {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${form._boundary}`,
         // "Content-Type": "multipart/form-data",
          "Cookie": sessionCookie 
        },
      }).then(function (response) {
        assert.strictEqual(
          response.status,
          200,
          "HTTP response status code 200"
        );
        done(); 
      }).catch(function (error) {
        assert.fail("Unexpected error received");
      });
    });

    it("can get the uploaded photo", function (done) {
      axios.get(makeFullUrl(`/photosOfUser/${user_id}`), {
          headers: {
            "Cookie": sessionCookie 
          }
       }).then(function (response) {
        assert.strictEqual(
          response.status,
          200,
          "HTTP response status code 200"
        );
        const newPhoto = _.find(response.data, function (p) {
          return p.file_name.match(uniquePhotoName);
        });
        assert(newPhoto, "Can not find upload photo");
        done()
      });
    });
  });


  describe("register user - post to /user", function (done) {
    const newUniqueLoginName = "u" + String(new Date().valueOf());
    
    it("can create a new user", function (done) {

      const params = {
        login_name: newUniqueLoginName,
        password: "weak2",
        first_name: "Fn" + newUniqueLoginName,
        last_name: "Ln" + newUniqueLoginName,
        location: "Loc" + newUniqueLoginName,
        description: "Desc" + newUniqueLoginName,
        occupation: "Occ" + newUniqueLoginName,
      };
      axios
        .post(makeFullUrl("/user"), params)
       .then(function (response) {
         assert.strictEqual(response.status, 200, "HTTP response status code 200");
         assert.strictEqual(
          response.data.login_name,
          params.login_name,
          "Response body contains login_name"
        );
        assert.strictEqual(
          response.data.email,
          params.email,
        "Response body contains email"
      );
      done();
      })
      .catch(function (error) {
       done(error);
      });
    });
      

    it("can reject a duplicate user", function (done) {
      const params = {
        login_name: newUniqueLoginName,
        password: "weak2",
        first_name: "Fn" + newUniqueLoginName,
        last_name: "Ln" + newUniqueLoginName,
        location: "Loc" + newUniqueLoginName,
        description: "Desc" + newUniqueLoginName,
        occupation: "Occ" + newUniqueLoginName,
      };
      axios
        .post(makeFullUrl("/user"), params)
        .then(function (response) {
          assert.fail("Expected error not received");
        })
       .catch(function (error) {
          assert.strictEqual(
            error.response.status,
            400,
            "HTTP response status code 400"
          );
          done();
       });
    });
  });
});