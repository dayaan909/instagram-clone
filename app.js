const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const http = require('http');
const socketIO = require('socket.io');

const server = http.createServer(app);
const io = socketIO(server);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io-client/dist'));

app.use(bodyParser.urlencoded({ extended: true }));

// Set up static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
let seacheduser=''
let isloggedIn=false
let username1=''

let userId=''
app.use(cookieParser());


 // Initialize it as false initially
// Middleware to set loggedInUser if cookie is present
const session = require('express-session');
const { profile } = require('console');

app.use(session({
    secret: 'dayaan',
    resave: false,
    saveUninitialized: true
}));
function ensureAuthenticated(req, res, next) {
  if (req.session.loggedInUser) {
    // User is authenticated, proceed to the next middleware
    next();
  } else {
    // User is not authenticated, redirect to login page or handle it as needed
    res.redirect('/');
  }
}

mongoose.connect("mongodb+srv://dayaan:dayaan@cluster0.imadrc8.mongodb.net/instaDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.log('Error connecting to MongoDB:', error);
});

// Define the file schema and model


const fileSchema = new mongoose.Schema({
  type: String,
  url: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Insta' },
  username: String,
  post: [
    {
      like: { type: [mongoose.Schema.Types.ObjectId], default: [] }, // Default value is an empty array
      comment: String,
      userwhocomment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Insta' }],
    },
  ],
});



const File = mongoose.model('File', fileSchema);
const notificationSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'Insta' },
  timestamp: { type: Date, default: Date.now },
  username: { type: String }, // Added username field
  profile:{type:String},
  
});





// Define the user schema and model
const instagramSchema = new mongoose.Schema({
    email: String,
    password: String,
    username: String,
    Fullname: String,
   // Add the files field
    profile:String,
    bio:String,
    Gender:String,
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Insta' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Insta' }],
    notifications: [notificationSchema],
    message: [{ sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Insta' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Insta' },
    message: String,
    timestamp: { type: Date, default: Date.now },
   
  }],
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
});
   


  
const Insta = mongoose.model('Insta', instagramSchema);


// ... Your multer storage and upload configuration ...

// Route to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Set up event listeners for socket connections


const upload = multer({ storage: storage });

const loginroute = express.Router();
app.use('/', loginroute);
loginroute.route('/')
  .get(getlogin)
  .post(postlogin);

const signuproute = express.Router();
app.use('/signup', signuproute);
signuproute.route('/')
  .get(getsignup)
  .post(postsignup);

function getlogin(req, res) {
  res.sendFile(__dirname + '/login.html');
}


function postlogin(request, response) {
    const info = request.body.login_info;
    const password = request.body.password;

    if (info) {
        Insta.findOne({ $or: [{ email: info }, { username: info }] })
            .then((user) => {
                if (!user || user.password !== password) {
                    // User not found or invalid credentials
                    response.send('Invalid email/username or password');
                } else {
                    // User found and password matches
                    console.log('loggedInUser cookie set:', user._id);
                    response.cookie('loggedInUser', user._id);
                    request.session.loggedInUser = user._id;

                    return response.status(200).redirect(`/home/${user.username}`);
                }
            })
            .catch((error) => {
                console.log(error);
                response.send('Error occurred during login');
            });
    }
}


      
      

function getsignup(req, res) {
  res.sendFile(__dirname + '/signup.html');
}
function isValidEmail(email) {
  // Simple email format check (contains '@')
  return email.includes('@');
}
// Import the crypto module for generating random codes
const crypto = require('crypto');

function generateRandomCode() {
  // Generate a random 6-digit verification code
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  return code;
}
const nodemailer = require('nodemailer');

// Create a transporter using Gmail SMTP


  // Send the email

// Example usage:
 // This will generate and print a random code
 let email=''
 let pass=''
 let usern=''
 let Fulln=''
function postsignup(request, response) {
   email = request.body.email;
   pass = request.body.password;
   usern = request.body.username;
  Fulln = request.body.Fullname;
  if (!isValidEmail(email)) {
    return response.status(400).send('Invalid email format');
  }
  const verificationCode = generateRandomCode();
  request.session.verificationCode = verificationCode;
 
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'instagram9282728@gmail.com',
      pass: 'ogjlklrssxcgmntn',
    },
  });
 

  function sendVerificationEmail(email, code) {
    // Email content and options
    const mailOptions = {
      from: 'instagram9282728@gmail.com',
      to: email,
      subject: 'Verification Code for Instagram Signup',
      text: `Your verification code is: ${code}`,
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending verification email:', error);
      } else {
        console.log('Verification email sent:', info.response);
        response.redirect('/verify');
      }
    });
  }
  // Send the verification code to the user's email (you can use a library like Nodemailer)
  sendVerificationEmail(email, verificationCode);

}
app.get('/verify',getVerification)
  
  function getVerification(req, res) {
    res.sendFile(__dirname + '/test3.html');
  }
  app.post('/verify',postVerification)
//   function postVerification(request, response) {
//     const enteredCode = request.body.code;
//     const storedCode = request.session.verificationCode;
  
//     if (enteredCode === storedCode) {
//       const newInsta = new Insta({ email, password, username, Fullname });
//       newInsta.save()
//         .then(() => {
//           console.log('User inserted successfully');
  
    
//         })
//         .catch((error) => {
//           console.log(error);
//           response.send('Error registering user');
//         });
//       response.redirect(`/home/${request.body.username}`);
//     } else {
//       // Code doesn't match, show an error message or handle it as needed
//       response.status(400).send('Invalid verification code');
//     }
// }
// app.js

// Import necessary modules...

// Create a new route for email verification

function postVerification(request, response) {
  const enteredCode = request.body.code;
  const storedCode = request.session.verificationCode;

  if (enteredCode === storedCode) {
    const password=pass
    const username=usern
    const Fullname=Fulln
    
    const newInsta = new Insta({ email, password, username, Fullname });
    newInsta.save()
      .then(() => {
        console.log('User inserted successfully');
        response.redirect(`/home/${username}`);
      })
      .catch((error) => {
        console.log(error);
        response.send('Error registering user');
      });
  } else {
    // Code doesn't match, show an error message or handle it as needed
    response.status(400).send('Invalid verification code');
  }
}




app.get('/home/:username', async (req, res) => {
  if (req.session.loggedInUser) {
    try {
      const loggedInUserId = req.session.loggedInUser;
      const user = await Insta.findOne({ username: req.params.username }).populate({
        path: 'files',
        populate: { path: 'user_id', select: 'profile' } // Populate user_id's profile field
      });
      const loggedInUser = await Insta.findOne({ _id: loggedInUserId });

      if (!user) {
        return res.status(404).send('User not found');
      }

      // const followingUserIds = user.following;

      // // Fetch all users that the loggedInUser is following
      // const followingUsers = await Insta.find({ _id: { $in: followingUserIds } });

      // let allPosts = [...user.files];

      // // Fetch posts from the users that the loggedInUser is following
      // for (const followingUser of followingUsers) {
      //   const followingUserPosts = await File.find({ user_id: followingUser._id });
      //   allPosts = allPosts.concat(followingUserPosts);
      // }
      const followingUserIds = user.following;

// Fetch all users that the loggedInUser is following
const followingUsers = await Insta.find({ _id: { $in: followingUserIds } });

let allPosts = [...user.files];

// Fetch posts from the users that the loggedInUser is following
for (const followingUser of followingUsers) {
  const followingUserPosts = await File.find({ user_id: followingUser._id })
    .populate('user_id', 'profile') // Populate the user_id field's profile
    .select('type url user_id username post'); // Select only necessary fields of files
  allPosts = allPosts.concat(followingUserPosts);
}

      console.log("this is all user",allPosts)
      res.render('home', {
        user: loggedInUser,
        allPosts: allPosts,
        username: req.params.username,
        loggedInUser: req.session.loggedInUser,
        searchQuery: ' ',
        userResults: ' ',
        searcheduser: ' ',
        getNotificationGroupTitle: getNotificationGroupTitle,
      });

    } catch (err) {
      console.log(err);
      return res.status(500).send('Error retrieving user.');
    }
  } else {
    res.redirect('/');
  }
});

 



app.post('/home/:username', upload.single('avatar'), (req, res) => {
 
    const loggedInUser = req.session.loggedInUser;

    Insta.findOne({ username: req.params.username })
        .then((user) => {
            if (!user) {
                return res.status(403).send('Unauthorized');
            }

            const file = req.file;

            if (!file) {
                return res.status(400).send('No file uploaded.');
            }

            const newFile = new File({
                type: file.mimetype.startsWith('image/') ? 'image' : 'video',
                url: 'uploads/' + file.filename,
                user_id: user._id
                        ,username:user.username
                       
                // Associate the file with the logged-in user
            });

            newFile.save()
            .then((savedFile) => {
                console.log('Saved file:', savedFile);
        
                // Push the saved file's _id to the user's files array
                user.files.push(savedFile._id);
        
                console.log('User before update:', user);
        
                // Save the updated user object
                return user.save();
            })
            .then((updatedUser) => {
                console.log('Updated user:', updatedUser);
        
                console.log('File information saved successfully');
                return res.status(200).redirect(`/home/${user.username}`);
            })
            .catch((err) => {
                console.log(err);
                return res.status(500).send('Error saving file.');
            });
          })
        })
        
//Import necessary modules and define the function
Date.prototype.isSameDay = function (date) {
  return (
    this.getFullYear() === date.getFullYear() &&
    this.getMonth() === date.getMonth() &&
    this.getDate() === date.getDate()
  );
};

function getNotificationGroupTitle(date) {
  const today = new Date();
  if (date.isSameDay(today)) {
    return 'Today';
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.isSameDay(yesterday)) {
    return 'Yesterday';
  }
  const thisweek = new Date(today);
  yesterday.setDate(today.getDate() - 6);
  if (date.isSameDay(thisweek)) {
    return 'thisweek';
  }

  return date.toDateString(); // Default to displaying the full date
}

// Pass the function to the EJS rendering context
async function fetchUserPosts(userId,allPosts) {
  const user = await Insta.findOne({ _id: userId });
  const followingUserIds = user.following;
  const followingUsers = await Insta.find({ _id: { $in: followingUserIds } });


  for (const followingUser of followingUsers) {
    const followingUserPosts = await File.find({ user_id: followingUser._id })
      .populate('user_id', 'profile')
      .select('type url user_id username post');
    allPosts = allPosts.concat(followingUserPosts);
  }

  return allPosts;
}



app.get('/search', async (req, res) => {
  const searchQuery = req.query.query;
  
  const usersearch = req.query.query;


  try {
    const userResults = await Insta.find({ $or: [{ email: searchQuery }, { username: searchQuery }] });
    const loggedInUserId = req.session.loggedInUser;
    
    
    userResults.forEach(user => {
      if (user.user_id && !user.user_id.profile) {
        user.user_id.profile = 'images/profile.png';
      }
    });

    // const loggedInUser = await Insta.findOne({ _id: loggedInUserId }).populate({
    //   path: 'files',
    //   populate: { path: 'user_id', select: 'profile _id' }
    // });
    
     
    Insta.findOne({ _id: loggedInUserId })
  .populate({
    path: 'files',
    populate: { path: 'user_id', select: 'profile  _id' }
  })
  .then(loggedInUser => {
    if (!loggedInUser) {
      return res.status(404).send('Logged-in user not found');
    }
    let allPosts = [...loggedInUser.files];
    const followingUserIds = loggedInUser.following;
    const followingUsersQuery = Insta.find({ _id: { $in: followingUserIds } });
      console.log("hbggffcdccf0",userResults.length > 0 ? userResults[0].username : null)
    followingUsersQuery.exec()
      .then(async followingUsers => {
        const allPosts1 = await fetchUserPosts(loggedInUserId,allPosts);
          console.log(allPosts)
        res.render('home', {
          searchQuery: req.query.query,
          userResults: userResults,
          loggedInUser: loggedInUser,
          username: loggedInUser.username,
          user: loggedInUser,
          files: loggedInUser.files,
          seacheduser: userResults.length > 0 ? userResults[0].username : null,
          getNotificationGroupTitle,
          messages: loggedInUser.message,
          allPosts: allPosts1
        });
      })
  })
      .catch(error => {
        console.error('Error retrieving following users:', error);
        res.status(500).json({ error: 'Error retrieving following users' });
      });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Error searching users' });
  }
});

app.get('/search/:seaheduser1', (req, res) => {
  const seacheduser=req.params.seaheduser1
  console.log(seacheduser)
  Insta.findOne({ $or: [{ email:seacheduser }, { username:seacheduser }] })
  .populate({
    path: 'files',
    populate: { path: 'user_id', select: 'profile  _id' }})
    .then(userResults => {
      // Retrieve the logged-in user's data from the session
      const loggedInUserId = req.session.loggedInUser;
        console.log(userResults)
      // Find the user data based on the logged-in user's ID
      Insta.findOne({ _id: loggedInUserId })
      .populate({
        path: 'files',
        populate: { path: 'user_id', select: 'profile  _id' }})
        .then(loggedInUser => {

  
          if (!loggedInUser) {
            return res.status(404).send('Logged-in user not found');
          }
      // Find the user data based on the logged-in user's ID
          // Pass loggedInUser, userResults, and other relevant data to the view
          const user = req.session.loggedInUser;

          
          Insta.findOne({ _id: user})  // Search by _id instead of username
          .populate({
            path: 'files',
            populate: { path: 'user_id', select: 'profile' }})
            .then((user1) => {
              if (!user1) {
                return res.status(404).send('User not found');
              }
     
   
          console.log(user1)
          userId=user._id
          //console.log( userResults.length > 0 ? userResults[0].files.url:null)
          res.render('profile', {
            seacheduser:userResults.username,
            user:userResults,
            loggedInUser: loggedInUser,
            files:userResults.length > 0 ? userResults[0].files : null,
            username:loggedInUser.username,
            
            user1:loggedInUser,//user1 is logged user
            message:loggedInUser.message
            
          });
       
        })
      
        
        .catch(error => {
          console.error('Error retrieving logged-in user:', error);
          res.status(500).json({ error: 'Error retrieving logged-in user' });
        });
      })
      })
    .catch(error => {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Error searching users' });
    });
  })

  // logged user following some other user
  app.post('/follow/:userId', ensureAuthenticated, async (req, res) => {
    try {
      const loggedInUserId = req.session.loggedInUser;
      const userIdToFollow = req.params.userId;
  
      // Update the logged-in user's following list
      await Insta.findOneAndUpdate(
        { _id: loggedInUserId },
        { $addToSet: { following: userIdToFollow } }
      ).exec();
  
      // Update the user being followed's followers list
      await Insta.findOneAndUpdate(
        { _id: userIdToFollow },
        { $addToSet: { followers: loggedInUserId } }
      ).exec();
       
      // Add a notification for the followed user
      const followerUser = await Insta.findById(loggedInUserId);
      const notification = {
        follower: loggedInUserId,
        username:followerUser.username,
        profile:followerUser.profile
      };
      await Insta.findOneAndUpdate(
        { _id: userIdToFollow },
        { $push: { notifications: notification } }
      ).exec();
  
      console.log('User followed successfully');
      //res.redirect('/search/'); // Redirect to a relevant page
      const previousUrl = req.headers.referer || '/'; // Capture the previous URL
// ... (perform follow action)
res.redirect(previousUrl); 
    } catch (err) {
      console.error('Error following user:', err);
      res.status(500).send('Error following user');
    }
  });
  //logged user notification
  app.get('/notifications', ensureAuthenticated, async (req, res) => {
    try {
      const loggedInUserId = req.session.loggedInUser;
      const loggedInUser = await Insta.findById(loggedInUserId).populate('notifications.follower');
      
      // Find the logged-in user data based on the ID
      Insta.findOne({ _id: loggedInUserId })
      .populate({
        path: 'files',
        populate: { path: 'user_id', select: 'profile' }})
        .then((user) => {
          if (!user) {
            return res.status(404).send('User not found');
          }
          if (!Array.isArray(loggedInUser.notifications)) {
            loggedInUser.notifications = [];
          }
          res.render('home', {
            loggedInUser: loggedInUser,
            showNotifications: true,
            user: user,
            files: user.files,
            username: user.username,
            searchQuery: ' ',
            userResult: ' ',
            seacheduser: ' ',
            getNotificationGroupTitle,
            allPosts:' '

          });
        })
        .catch((err) => {
          console.error('Error retrieving user:', err);
          res.status(500).send('Error retrieving user');
        });
    } catch (err) {
      console.error('Error retrieving notifications:', err);
      res.status(500).send('Error retrieving notifications');
    }
  });

 //when click on name showing in notification display user profile
 app.get('/notification/user/:followerId', ensureAuthenticated, (req, res) => {
  const followerId = req.params.followerId;

  Insta.findOne({ _id: followerId })
  .populate({
    path: 'files',
    populate: { path: 'user_id', select: 'profile' }})
    .then((followerUser) => {
      if (!followerUser) {
        return res.status(404).send('User not found');
      }
      const user1 = req.session.loggedInUser;

          
      Insta.findOne({ _id: user1})  // Search by _id instead of username
      .populate({
        path: 'files',
        populate: { path: 'user_id', select: 'profile' }})
        .then((user1) => {
          if (!user1) {
            return res.status(404).send('User not found');
          }
      // Render the follower user's profile
      res.render('profile', {
        user: followerUser,
        loggedInUser: req.session.loggedInUser, // Assuming you still want to pass the logged-in user's data
        files: followerUser.files,
        seacheduser:followerUser.username,
        username: user1.username,
        user1:user1,
      
      });
    })
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send('Error retrieving user.');
    });
});
// Assuming this is your Express route handler
app.post('/like/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.session.loggedInUser;

    if (!userId) {
      return res.status(400).json({ error: 'User not logged in' });
    }

    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const postIndex = file.post.findIndex(post => post.like.includes(userId));

    if (postIndex === -1) {
      // User hasn't liked the post, so add their like
      file.post.push({ like: [userId] });
    } else {
      // User has liked the post, so remove their like
      const userIndex = file.post[postIndex].like.indexOf(userId);
      file.post[postIndex].like.splice(userIndex, 1);
    }

    await file.save();

    const likeCount = file.post.reduce((total, post) => total + post.like.length, 0);

    res.json({ isLiked: postIndex === -1, likeCount });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});




// app.get('/like/:postId/:_idUser', ensureAuthenticated, (req, res) => {
//   const postId = req.params.postId;
//   const loggedInUserId = req.session.loggedInUser;
//   const userId = req.params.idUser;
//  // Assuming user is authenticated and user info is stored in req.user

//   File.findOne({_id:postId})
//   .populate({
//         path: 'files',
//         populate: { path: 'user_id', select: 'profile' }})
//   .then((files)=>{
//       if (err || !post) {
//           return res.status(404).json({ error: 'Post not found' });
//       }

//       // Check if the user has already liked the post
//       const hasLiked = post.post.some(like => like.user.equals(userId));

//       if (hasLiked) {
//           // Unlike
//           post.post = post.post.filter(like => !like.user.equals(userId));
//       } else {
//           // Like
//           post.post.push({ user: userId });
//       }

//       post.save((err) => {
//           if (err) {
//               return res.status(500).json({ error: 'Internal server error' });
//           }
//           res.redirect('/home'); // Redirect to home page or wherever you want
//       });
//   });
// });


app.delete('/delete/:postId', (req, res) => {
  const postId = req.params.postId;
 console.log("hey i am here")
  // Use Mongoose to find and remove the post by ID
  File.findByIdAndRemove(postId)
    .then(deletedPost => {
      if (!deletedPost) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.status(200).json({ message: 'Post deleted successfully' });
    })
    .catch(error => {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Error deleting post' });
    });
});


app.get('/message/:recipientUsername', ensureAuthenticated, async (req, res) => {
  const loggedInUser = req.session.loggedInUser;
  const recipientUsername = req.params.recipientUsername;

  try {
    const user = await Insta.findOne({ _id: loggedInUser }).populate({
        path: 'files',
        populate: { path: 'user_id', select: 'profile' }});
    const recipientUser = await Insta.findOne({ username: recipientUsername });

    if (!user || !recipientUser) {
      return res.status(404).send('User or recipient not found');
    }
   
    const messagesSent = user.message.map(message => ({
      ...message.toObject(),
      sender: user._id, // Use the ObjectId of the user
    }));
    const messagesReceived = recipientUser.message.map(message => ({
      ...message.toObject(),
      sender: recipientUser._id, // Use the ObjectId of the recipient user
    }));

    const allMessages = [...messagesSent, ...messagesReceived].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    const userIDsWithMessages = new Set();
    allMessages.forEach(message => {
      userIDsWithMessages.add(message.sender.toString());
      userIDsWithMessages.add(message.recipient.toString());
    });

    const userMessages = user.message.map(message => ({
      sender: message.sender.toString(),
      recipient: message.recipient.toString(),
  }));

  const allUsersWithMessages = new Set();
  userMessages.forEach(message => {
      allUsersWithMessages.add(message.sender);
      allUsersWithMessages.add(message.recipient);
  });

    const users = await Insta.find({ _id: { $in: Array.from(allUsersWithMessages) } });

    // Find the logged-in user and exclude them from the list
   
    // Convert the logged-in user ID to a string
   // const loggedInUser = loggedInUser.toString();
    const loggedInUserId = users.find(u => u._id.toString() === loggedInUser.toString());
    const otherUsers = users.filter(u => u._id.toString() !== loggedInUserId.toString())
    // Filter out the logged-in user from the list
    
   
    const conversations = await Insta.find({
      $or: [
        { 'message.sender': loggedInUser },
        { 'message.recipient': loggedInUser }
      ]
    }).select('username');

    console.log("All Messages:", allMessages);
    res.render('message', {
      recipientUser: recipientUser,
      messages: allMessages,
      loggedInUser: user,
      //usersWithMessages: filteredUsersWithMessages,
      conversations: conversations,
      otherUsers:otherUsers
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('sendMessage', async (messageData) => {
    try {
      const recipientUser = await Insta.findOne({ username: messageData.recipient });

      if (!recipientUser) {
        return;
      }

      const newMessage = {
        sender: messageData.sender,
        recipient: recipientUser._id,
        message: messageData.message,
        timestamp: Date.now() // Assign current timestamp to the new message
      };

      // Update the sender's messages array only
      await Insta.findByIdAndUpdate(
        { _id: messageData.sender },
        { $push: { message: newMessage } }
      );

      // Emit the message to the sender's socket
      const senderSocket = io.sockets.connected[socket.id];
      if (senderSocket) {
        senderSocket.emit('message', newMessage);
      }

      // Emit the message to the recipient's socket
      const recipientSocket = io.sockets.connected[recipientUser.socket];
      if (recipientSocket) {
        recipientSocket.emit('message', newMessage);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });
});
app.get('/allmessage', ensureAuthenticated, async (req, res) => {
  try {
      const loggedInUserId = req.session.loggedInUser;
      const user = await Insta.findOne({ _id: loggedInUserId });

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      const userMessages = user.message.map(message => ({
          sender: message.sender.toString(),
          recipient: message.recipient.toString(),
      }));

      const allUsersWithMessages = new Set();
      userMessages.forEach(message => {
          allUsersWithMessages.add(message.sender);
          allUsersWithMessages.add(message.recipient);
      });

      const users = await Insta.find({ _id: { $in: Array.from(allUsersWithMessages) } });

      // Find the logged-in user and exclude them from the list
      const loggedInUser = users.find(u => u._id.toString() === loggedInUserId.toString());
      const otherUsers = users.filter(u => u._id.toString() !== loggedInUserId.toString());

      res.json({ loggedInUser: loggedInUser, users: otherUsers });
  } catch (err) {
      console.error('Error retrieving users with messages:', err);
      res.status(500).json({ error: 'An error occurred' });
  }
});


app.get('/message/profile/:name', ensureAuthenticated, (req, res) => {
  const loggedUser = req.session.loggedInUser;
  const username = req.params.name;
  console.log("Requested username:", username);
 
      if (!loggedUser) {
        return res.status(404).send('User not found');
      }
      Insta.findOne({ username: username })
        .populate({
        path: 'files',
        populate: { path: 'user_id', select: 'profile' }})
        .then((user) => {
          if (!user) {
            return res.status(404).send('User not found');
          }
         
          // Check if the searched user's profile is available, otherwise use a default profile image
         
           Insta.findOne({_id:loggedUser})
           .populate({
        path: 'files',
        populate: { path: 'user_id', select: 'profile' }})
           .then((user1)=>{
          if(!user){
            return res.status(404).send("user not found");
          }
          res.render('profile', {
            user1: user1,//logged user
            username: user1.username,
            seacheduser: user.username,
            files: user.files,
            user: user,
            loggedInUser:user1,
          });
        })
        .catch((err) => {
          console.log(err);
          return res.status(500).send('Error retrieving user.');
      })
        .catch((err) => {
          console.log(err);
          return res.status(500).send('Error retrieving user.');
     
        })
     
});
})
  // ... Other socket event handlers ...

  // When a user disconnects, remove their socket ID from the userSockets object






// Start server










app.get('/logout', (req, res) => {
  console.log('Logout route hit');
  res.clearCookie('loggedInUser');
  req.session.loggedInUser = null;

  // Perform any other logout-related actions
  res.redirect('/');
});

app.get('/:user', ensureAuthenticated, (req, res) => {
  const loggedInUser = req.session.loggedInUser;
  const username = req.params.user;

  if (loggedInUser) {
    Insta.findOne({ _id: loggedInUser })
      .populate({
        path: 'files',
        populate: { path: 'user_id', select: 'profile' }})
      .then((user1) => {
        if (!user1) {
          return res.status(404).send('User not found');
        }

        Insta.findOne({ username: username })
          .populate({
        path: 'files',
        populate: { path: 'user_id', select: 'profile' }})
          .then((user) => {
            if (!user) {
              return res.status(404).send('User not found');
            }

            res.render('profile', {
              user: user,
              loggedInUser: user1,
              files: user.files,
              seacheduser: user.username,
              username: user1.username,
              user1: user1,
            });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).send('Error retrieving user.');
          });
      });
  } else {
    res.redirect('/');
  }
});


app.post('/:user', ensureAuthenticated, upload.single('dp'), (req, res) => {
  const loggedInUser = req.session.loggedInUser;
  const username = req.params.user; // Get the username from the URL parameter
let name=''
  if (loggedInUser) {
    Insta.findOne({ _id: loggedInUser })
      .populate({
        path: 'files',
        populate: { path: 'user_id', select: 'profile' }})
      .then((user) => {
        if (!user) {
          return res.status(404).send('User not found');
        }

        // Update user profile and bio here
        const file = req.file;
        const bio = req.body.bio;
        const Gender = req.body.gender;

        if (file) {
          // Update profile image URL for both user and user.files
          user.profile = 'uploads/' + file.filename;
          user.files.forEach((file) => {
            file.profile = 'uploads/' + file.filename;
          });
        }
         name=user.username
        user.bio = bio;
        user.Gender = Gender;
        return user.save();
        
      })
      .then((updatedUser) => {
        console.log('Updated user:', updatedUser);
        console.log('Profile information saved successfully');
        return res.status(200).redirect(`/${name}`);
        // Redirect back to the user's profile page
        //return res.status(200).redirect(`/${username}`);
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).send('Error saving profile information.');
      });
  }
});



server.listen(2000, function () {
  console.log('Server is running on port 2000');
});


