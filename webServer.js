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

 const session = require('express-session');
 const bodyParser = require('body-parser');
 const multer = require('multer');
 const path = require('path');
const fs = require("fs");

 const processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

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
 app.use(session({secret: "secretKey", resave: false, saveUninitialized: false}));
app.use(bodyParser.json());
app.get("/", function (request, response) {
  const filePath = path.join(__dirname, 'photo-share.html');
  fs.readFile(filePath, 'utf8', function (err, data) {
      if (err) {
          console.error(err);
          response.status(500).send('Error reading file');
      } else {
          response.send(data);
      }
  });
});

app.get("/:file", function (request, response) {
  const filePath = path.join(__dirname, request.params.file);
  fs.readFile(filePath, 'utf8', function (err, data) {
      if (err) {
          console.error(err);
          response.status(404).send('File not found');
      } else {
          response.send(data);
      }
  });
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
  if (!request.session.user) {
    response.status(401).send('unauthorized..');
    return;
  }
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
 
 
 app.get("/user/list", function (request, response) {
  console.log("Id of Logged in User:" + request.session.user._id);
  if (!request.session.user) {
    response.status(401).send('unauthorized..');
    return;
  }
  User.find({}, "_id first_name last_name", function (err, users) {
    if (err) {
      console.error("Error in /user/list:", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    console.log(users);
    response.status(200).send(users);
  });
});

app.get("/user/:id", function (request, response) {
  if (!request.session || !request.session.user) {
    response.status(401).send('unauthorized..');
    return;
  }

  const id = request.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    response.status(400).send("Invalid user ID!");
    return;
  }

  User.findById(id, "_id first_name last_name location description occupation favorites", function (err, user) {
    if (err) {
      console.error("Error in /user/:id:", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }

    if (!user) {
      response.status(400).send("Could not find user.");
      return;
    }

    response.status(200).send(user);
  });
});

app.get('/loginUser', function(request, response) {
  const session_user_id = request.session.user_id;
  const session_user_first_name = request.session.first_name;
  const session_user_last_name = request.session.last_name;
  if (!session_user_id) {
    const loginUserDetail = {
      _id: session_user_id,
      first_name: session_user_first_name,
      last_name: session_user_last_name
    };
    response.status(200).send(loginUserDetail);
  } else {
    response.status(401).send('unauthorized user.');
  }
});

app.get('/photosOfUser/:id', async function (request, response) {
  const sessionUserId = request.session.user_id;
  if (!sessionUserId || !request.session.user) {
    console.error('Doing /photosOfUser/:id error: ');
    response.status(401).send("unauthorized..");
    return;
  }

  try {
    const id = request.params.id;
    const photosModel = await Photo.find({ user_id: id }).exec();


    const photosArr = await Promise.all(
      photosModel.map(async (photo) => {
        const isOwner = JSON.stringify(photo.user_id) === '"' + request.session.user_id + '"';
        let canView = true;
        if (photo.permissions) {
          canView = isOwner || photo.sharedList.includes(id);
        }
        if (!canView) {
          return null; // Skip this photo if the user doesn't have permission to view
        }
        const commentsArr = await Promise.all(
          photo.comments.map(async (comment) => {
            const user = await User.findOne({ _id: comment.user_id }).exec();
            return {
              comment: comment.comment,
              date_time: comment.date_time,
              _id: comment._id,
              user: {
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
              },
            };
          })
        );
        return {
          _id: photo._id,
          user_id: photo.user_id,
          comments: commentsArr,
          file_name: photo.file_name,
          date_time: photo.date_time,
          permissions: photo.permissions,
          sharedList: photo.sharedList,
        };
      })
    );
    
    console.log('Returned the user photos with id: ' + id);
    response.status(200).send(photosArr);
  } catch (error) {
    console.error('Doing /photosOfUser/:id error: ', error);
    response.status(400).send(JSON.stringify(error));
  }
});

app.post('/admin/login', (request, response) => {
  const { login_name, password } = request.body;

  User.findOne({ login_name })
    .then(user => {
      if (!user) {
        response.status(400).send('Invalid login name');
        return;
      }

      if (user.password !== password) {
        response.status(400).send('Incorrect password');
        return;
      }

      request.session.user = user;
      request.session.login_name = user.login_name;
      request.session.user_id = user._id;
      request.session.first_name = user.first_name;

      response.status(200).json({
        _id: user._id,
        login_name: user.login_name,
        favorites: [],
      });
    })
    .catch(error => {
      console.error('Login error:', error);
      response.status(500).send('An error occurred during login!');
    });
});

app.post('/admin/logout', (request, response) => {
  if (request.session) {
    delete request.session.userId;
    response.send({ message: 'User has logged out!' });
  } else {
    response.status(400).send({ error: 'Not logged in!' });
    request.session.destroy(function () {
      console.log("couldn't destroy.");
    });
  }
});

app.post('/commentsOfPhoto/:photo_id', function (request, response) {
  const { user_id } = request.session;

  if (!request.session.user || !user_id) {
    response.status(401).send('unauthorized..');
    return;
  }

  if (request.body.comment.length === 0) {
    response.status(400).send("Comment cannot be empty!");
    return;
  }



  const { photo_id } = request.params;

  Photo.findOne({ _id: photo_id }, function (err, photo) {
    if (err) {
      console.error("Photo with id: ", photo_id, " not found!");
      response.status(400).send(JSON.stringify(err));
      return;
    }

    const comment = {
      date_time: new Date(),
      comment: request.body.comment,
      user_id
    };
    if (request.body.mentions) {
        comment.mentions = request.body.mentions; // Add the mentions field
      }
    
    if (comment.mentions) {
        photo.mentionedUserIds = Array.from(new Set([...photo.mentionedUserIds, ...comment.mentions]));
        console.log("photo.mentioned in webServer: ", photo.mentionedUserIds);
    }

    photo.comments.push(comment);
    photo.save(function (error) {
      if (err) {
        console.error("Error saving photo:", error);
        response.status(500).send("Error saving photo!");
        return;
      }
      response.status(200).send("Comment added!");
    });
  });
});

app.post('/photos/new', function (request, response) {
  const id = request.session.user_id;
  if (!id) {
      response.status(400).send('No user is logged in.');
      return;
  }

  processFormBody(request, response, function (err) {
      if (err || !request.file) {
          response.status(400).send(JSON.stringify(err));
          return;
      }
      const timestamp = new Date().valueOf();
      const filename = 'U' +  String(timestamp) + request.file.originalname;
      
      fs.writeFile("./images/" + filename, request.file.buffer, function (error2) {
          if (error2){
              response.status(400).send(JSON.stringify(error2));
              return;
          }
      const {permissions, shared} = request.body;
      const updatedSharedList = shared.split(",") || [];
      function doneCallback(error3, newPhoto) {
        console.log(newPhoto);
        if (error3) {
            response.status(400).send(JSON.stringify(error3));
            return;
        }
        newPhoto.save();
        response.status(200).send("Added photo");
    }
        
      Photo.create({user_id: id, 
          date_time: new Date(),
          file_name: filename,
          comments: [],
          permissions: permissions,
          sharedList: updatedSharedList,
      }, doneCallback);


      });
  });
});
app.post('/user', function (request, response) {
  const {
    login_name,
    password,
    first_name,
    last_name,
    location,
    occupation,
    description,
    favorites
  } = request.body;
  User.findOne({ login_name }, (err, user) => {
    if (user !== null && user !== undefined) {
      response.status(400).send(`User with login_name ${login_name} already exists!`);
      return;
    }

    if (password.length === 0) {
      response.status(400).send('Password cannot be empty!');
      return;
    }

    if (first_name.length === 0) {
      response.status(400).send('First name cannot be empty!');
      return;
    }

    if (last_name.length === 0) {
      response.status(400).send('Last name cannot be empty!');
      return;
    }

    function callback(error, newUser) {
      if (error) {
        response.status(400).send(JSON.stringify(error));
        return;
      }

      newUser.save(function (error2) {
        if (error2) {
          response.status(500).send('ERROR occurred while saving the user!');
          return;
        }

        response.status(200).json({
          login_name: newUser.login_name,
          email: newUser.email
        });
      });
    }

    User.create({
      login_name,
      password,
      first_name,
      last_name,
      location,
      description,
      occupation,
      favorites // Include the favorites property here
    }, callback);
  });
});


//! Deleting comments, photos, and account.
//! Deleting a comment - simple
//! Deleting a photo -> delete photo + comments of the photo
//! Deleting an account -> delete account + all photos + all comments the user has made


function requireLogin(request, response, next) {
  const { user_id } = request.session;

  if (!user_id) {
    response.status(401).send('Unauthorized');
    return;
  }

  next();
}
//!! handle photo deletion
app.delete('/photos/:id', requireLogin, function (request, response) {
  const { user_id } = request.session;
  const { id } = request.params;

  Photo.findOneAndDelete({ _id: id, user_id }, function (err, deletedPhoto) {
    if (err) {
      console.error('Error deleting photo:', err);
      response.status(400).send('Error deleting photo');
    } else if (!deletedPhoto) {
      response.status(404).send('Photo not found');
    } else {
      // Delete associated comments
      const commentIds = deletedPhoto.comments.map(comment => comment._id);

      Photo.updateMany(
        { 'comments._id': { $in: commentIds } },
        { $pull: { comments: { _id: { $in: commentIds } } } },
        function (err1) {
          if (err1) {
            console.error('Error deleting comments:', err1);
            response.status(500).send('An error occurred');
          } else {
            response.sendStatus(204);
          }
        }
      );
    }
  });
});



//!! handle comment deletion of a user

app.delete('/comments/:id', requireLogin, async function (request, response) {
  const { user_id } = request.session;
  const { id } = request.params;

  try {
    const photo = await Photo.findOne({ 'comments._id': id, 'comments.user_id': user_id }).exec();

    if (!photo) {
      response.status(404).send('Comment not found');
      return;
    }

    // Find the index of the comment within the comments array
    const commentIndex = photo.comments.findIndex(comment => comment._id.toString() === id);

    if (commentIndex === -1) {
      response.status(404).send('Comment not found');
      return;
    }

    // Remove the comment from the comments array
    photo.comments.splice(commentIndex, 1);

    // Save the updated photo document
    await photo.save();

    response.sendStatus(204);
  } catch (error) {
    console.error('Error deleting comment:', error);
    response.status(500).send('An error occurred');
  }
});
//!! handle account deletion


app.post('/user/delete', async function (request, response) {
  const { user_id } = request.session;

  if (!user_id) {
    response.status(401).send('Unauthorized');
    return;
  }

  try {
    const user = await User.findOne({ _id: user_id }).exec();

    if (!user) {
      response.status(404).send('User not found');
      return;
    }

    if (user_id.toString() !== user._id.toString()) {
      response.status(403).send('You cannot delete other user accounts');
      return;
    }

    // Delete the user's comments
    await Photo.updateMany(
      { 'comments.user_id': user_id },
      { $pull: { comments: { user_id: user_id } } }
    ).exec();

    // Delete the user account
    await User.deleteOne({ _id: user_id }).exec();

    // Destroy the session
    request.session.destroy((err) => {
      if (err) {
        console.error(`Error destroying session: ${err}`);
        response.status(500).send('An error occurred');
      } else {
        response.status(200).send('User account deleted');
      }
    });
  } catch (error) {
    console.error(`Error deleting user account: ${error}`);
    response.status(500).send('An error occurred');
  }
});


// Fetch mentioned photos for a specific user

async function getMentionedPhotos(request, response) {
  const userId = request.params.userId;
  console.log("userId: ", userId);
  
  try {
    const mentionedPhotos = await Photo.find({ mentionedUserIds: userId }).exec();
    console.log("mentionedPhotos: ", mentionedPhotos);
    response.status(200).json(mentionedPhotos);
  } catch (error) {
    console.error("Error fetching mentioned photos:", error);
    response.status(500).send("Error fetching mentioned photos");
  }
}
app.get('/mentionedPhotos/:userId', getMentionedPhotos);

// Add mention to a photo

async function addMentionToPhoto(req, res) {
  const { photoId } = req.params;
  const { userId } = req.body;

  try {
    const photo = await Photo.findById(photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    photo.mentions.push(userId);
    await photo.save();

    res.status(200).json({ message: 'Mention added to the photo' });
    return res.status(200).json({ message: 'Mention added to the photo' });
  } catch (error) {
    console.error('Error adding mention to photo:', error);
    res.status(500).json({ error: 'Internal server error' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
app.post('/photos/mentions/:photoId', addMentionToPhoto);


// Fetch photos with mentions of a specific user

async function getPhotosWithMentions(req, res) {
  const { userId } = req.params;

  try {
    const photos = await Photo.find({ 'comments.mentions': userId });

    res.status(200).json(photos);
  } catch (error) {
    console.error('Error fetching mentioned photos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
app.get('/photos/mentions/:userId', getPhotosWithMentions);


app.listen(3000, function () {
  console.log("Listening on port 3000");
});
