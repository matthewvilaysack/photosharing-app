/**
 * This builds on the webServer of previous projects in that it exports the
 * current directory via webserver listing on a hard code (see portno below)
 * port. It also establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch
 * any file accessible to the current user in the current directory or any of
 * its children.
 *
 * This webServer exports the following URLs:
 * /            - Returns a text status message. Good for testing web server
 *                running.
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns the population counts of the cs142 collections in the
 *                database. Format is a JSON object with properties being the
 *                collection name and the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the
 * database:
 * /user/list         - Returns an array containing all the User objects from
 *                      the database (JSON format).
 * /user/:id          - Returns the User object with the _id of id (JSON
 *                      format).
 * /photosOfUser/:id  - Returns an array with all the photos of the User (id).
 *                      Each photo should have all the Comments on the Photo
 *                      (JSON format).
 */

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const async = require("async");

const express = require("express");
const app = express();

// Load the Mongoose schema for User, Photo, and SchemaInfo
const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/cs142project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

/**
 * Use express to handle argument passing in the URL. This .get will cause
 * express to accept URLs with /test/<something> and return the something in
 * request.params.p1.
 * 
 * If implement the get as follows:
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
app.get("/test/:p1", function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params
  // objects.
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";

  if (param === "info") {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will
    // match it.
    SchemaInfo.find({}, function (err, info) {
      if (err) {
        // Query returned an error. We pass it back to the browser with an
        // Internal Service Error (500) error code.
        console.error("Error in /user/info:", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object -
        // This is also an internal error return.
        response.status(500).send("Missing SchemaInfo");
        return;
      }

      // We got the object - return it in JSON format.
      console.log("SchemaInfo", info[0]);
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === "counts") {
    // In order to return the counts of all the collections we need to do an
    // async call to each collections. That is tricky to do so we use the async
    // package do the work. We put the collections into array and use async.each
    // to do each .count() query.
    const collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];
    async.each(
      collections,
      function (col, done_callback) {
        col.collection.countDocuments({}, function (err, count) {
          col.count = count;
          done_callback(err);
        });
      },
      function (err) {
        if (err) {
          response.status(500).send(JSON.stringify(err));
        } else {
          const obj = {};
          for (let i = 0; i < collections.length; i++) {
            obj[collections[i].name] = collections[i].count;
          }
          response.end(JSON.stringify(obj));
        }
      }
    );
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400)
    // status.
    response.status(400).send("Bad param " + param);
  }
});

/**
 * URL /user/list - Returns all the User objects.
 */
 app.get("/user/list", function (request, response) {
  User.find({}, "_id first_name last_name", function (err, users) {
    if (err) {
      console.error("Error in /user/list:", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }

    response.status(200).send(users);
  });
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
 app.get("/user/:id", function (request, response) {
  const id = request.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    response.status(400).send("Invalid user ID.");
    return;
  }

  User.findById(id, "_id first_name last_name location description occupation", function (err, user) {
    if (err) {
      console.error("Error in /user/:id:", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }

    if (!user) {
      response.status(400).send("User not found");
      return;
    }

    response.status(200).send(user);
  });
});


// Helper functions for /photosOfUser/:id route.

async function fetchUserPhotos(userId) {
  return Photo.find({ user_id: userId }).populate("user_id", "_id first_name last_name").exec();
}


async function fetchUserById(userId) {
  return User.findById(userId).exec();
}

async function fetchPhotoComments(comments) {
  return Promise.all(
    comments.map(async (comment) => {
      const user = await fetchUserById(comment.user_id);
      return {
        _id: comment._id,
        comment: comment.comment,
        date_time: comment.date_time,
        user: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name
        }
      };
    })
  );
}
async function preparePhotoObjects(photos) {
  return Promise.all(
    photos.map(async (photo) => {
      const comments = await fetchPhotoComments(photo.comments);
      return {
        _id: photo._id,
        user_id: photo.user_id,
        comments: comments,
        file_name: photo.file_name,
        date_time: photo.date_time
      };
    })
  );
}


/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
 app.get("/photosOfUser/:id", async function (request, response) {
  const id = request.params.id;
  const photos = await fetchUserPhotos(id);

  try {
    if (photos.length === 0) {
      console.log(`Photos for user with _id: ${id} not found.`);
      return response.status(404).send("Not found");
    }
    const photoObjs = await preparePhotoObjects(photos);

    response.status(200).send(photoObjs);
  } catch (error) {
    console.error("Error fetching user photos:", error);
    response.status(400).send("Invalid ID");
  }
  return photos;
});
app.listen(3000, function () {
  console.log("Listening on port 3000");
});
