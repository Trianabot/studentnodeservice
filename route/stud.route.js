const express= require('express');
const router = express.Router();
const studentModel = require('../model/student.model');
const subjectModel = require('../model/subjectData.model');
const SimpleCrypto = require("simple-crypto-js").default;
const TokenGenModel = require('../model/tokengen.model');
const randomstring = require('randomstring');
const _secretKey = "some-unique-key";
const uuid = require('uuid4');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const simpleCrypto = new SimpleCrypto(_secretKey);
const validateToken=require('../config/auth-token');
const nodemailer = require("nodemailer");
const smtpTransport = require('nodemailer-smtp-transport');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
function createToken(user) {
    return jwt.sign({ id: user.userId, email: user.emailId }, config.jwtSecret, {
      expiresIn: '2h' // 86400 expires in 24 hours
    });
  }

router.get('/getstudinfo',validateToken,(req,res)=>{
    studentModel.find({"isVerified": false}).then(data=>{
        res.status(200).send({ message:"student data",data:data });
    }).catch(err=>{
        res.status(400).send({ message:"error while getting student info",err:err });
    })
})

router.post('/register',(req,res)=>{

    studentModel.findOne({ emailId: req.body.emailId }, (err, user) => {
        // Make sure user doesn't already exist
        if (user) return res.status(400).send({ message: 'The email address you have entered is already associated with another account.' });
        // Create and save the admin
        var id = uuid();
  
        var epassword = simpleCrypto.encrypt(req.body.password);
        // var epassword = req.body.password;
          
        try {
          let userregister = new studentModel(
            {
              userId: id,
              userName: req.body.userName,
              lastName:req.body.lastName,
              emailId: req.body.emailId,
              password: epassword,
              gender: req.body.gender,
              city: req.body.city,
              district:req.body.district,
              course:req.body.course,
              degree:req.body.degree,
              university:req.body.university,
              sysCreatedBy: id,
              sysUpdatedBy: id,
              isActive: false,
              isBlocked: false,
              isAdmin: false,
              sysCreatedDate: new Date().getTime(),
              sysUpdatedDate: new Date().getTime()
  
            });
          userregister.save((err, userdata) => {
           
            if (!err) {
              var token = new TokenGenModel({ userId: userdata.userId, token: randomstring.generate() });
              // Save the verification token
              token.save(function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                // Send the email
                var transporter = nodemailer.createTransport(smtpTransport({ service: 'Gmail', auth: { user: "stomachcrew@gmail.com", pass: "ache@123" }, tls: { rejectUnauthorized: false } }));
                var options = {
                  viewEngine: {
                    extname: '.hbs',
                    layoutsDir: path.join(__dirname, '../views/email/'),
                    defaultLayout: 'template',
                    partialsDir: path.join(__dirname,'../views/partials/')
                  },
                  viewPath: path.join(__dirname, '../views/email/'),
                  extName: '.hbs'
                };
                transporter.use('compile', hbs(options));
             //   var confirmationUrl = 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/user\/confirmation\/' + token.token + '.\n'
                var mailOptions = {
                  from: 'stomachcrew@gmail.com',
                  to: req.body.emailId,
                  subject: 'Welcome In E Learning ',
                  template: 'emails_body',
                  context: {
                    host: req.headers.host,
                    port: config.port,
                    emailId:req.body.emailId,
                   url: 'http://' + config.redirectUrl +  '/login/verify/' +req.body.emailId
                  }
                
                };
            
            
                transporter.sendMail(mailOptions, function (err) {
                  if (err) {
                    console.log("errerrerr",err);
                     return res.status(500).send({ msg: err.message }); 
                    }
                  res.status(200).send({ message: 'Registration Successful . A verification email has been sent to ' + userdata.emailId + '.' });
                });
              });
            } else {
              res.status(500).send({ message: err });
            }
          });
        } catch (e) {
          res.status(500).send(e);
        }
      });
});

router.post('/login',(req,res)=>{
  studentModel.findOneAndUpdate({ emailId: req.body.emailId }, {
          $set: { isActive: req.body.isActive }
        }, { new: true }, (error, userDoc) => {
          console.log("userDocuserDoc",userDoc);
          if (error) throw error;
          if (!userDoc) {
            return res.status(401).send({ success: false, message: 'Authentication failed. Wrong credentials' });
          }
          if (userDoc.isBlocked == true) {
            return res.status(401).send({ success: false, message: 'Your account is bloked. Please contact: ' + 'stomachcrew@gmail.com' });
          }
          if (userDoc.isDeleted == true) {
            return res.status(401).send({ success: false, message: 'Your account is deleted. Please contact: ' + 'stomachcrew@gmail.com' });
          }
          var dpassword = simpleCrypto.decrypt(userDoc.password);
         // let isvalidPasswordWithoutHashed = req.body.password; // Its only for Old user
           
          if ((dpassword == req.body.password)) {
            if (!userDoc.isVerified) {
              console.log("Please verify your email to login");
              return res.status(401).send({ message: 'Please verify your email to login' });
            }
            return res.status(200).json({
              success: true,
              token: createToken(userDoc),
              userData: userDoc
            });
      
          } else {
            return res.status(401).send({ success: false, message: 'Authentication failed. Wrong credentials' });
          }
        });
})

router.post('/verifystudent',(req,res)=>{
    studentModel.findOneAndUpdate({ emailId: req.body.emailId }, { $set: { isVerified: req.body.isVerified } }, { new: true }, (error, userDoc) => {
      if (error) throw error;
      return res.status(200).send({ userDoc: userDoc, message: 'logout successfully' });
    });
  });


//To update password(26/07/2019:monika)
router.post('/logout', function (req, res) {
  
  studentModel.findOneAndUpdate({ emailId: req.body.emailId }, { $set: { isActive: req.body.isActive } }, { new: true }, (error, userDoc) => {
    if (error) throw error;
    return res.status(200).send({ userDoc: userDoc, message: 'logout successfully' });
  });
});

//To get friend profile
router.post('/friendprofile', (req, res) => {
  studentModel.find({userId: req.body.userId}).then(data => {
      res.status(200).send({
          message: 'get friend profile',
          data: data
      });
  }).catch(err => {
      res.status(500).send({
          message: 'Error while getting friend profile',
          err: err
      });
  })
});

router.put('/likePost', (req,res)=>{
// Check if id was passed provided in request body
if (!req.body.memeId) {
  res.json({ success: false, message: 'No id was provided.' }); // Return error message
} else {
  // Search the database with id
  subjectModel.findOne({ MemeId: req.body.memeId }, (err, blog) => {
    // Check if error was encountered
    if (err) {
      res.json({ success: false, message: 'Invalid blog id' }); // Return error message
    } else {
      // Check if id matched the id of a blog post in the database
      if (!blog) {
        res.json({ success: false, message: 'That blog was not found.' }); // Return error message
      } else {
        // Get data from user that is signed in
        studentModel.findOne({ userId: req.body.userId }, (err, user) => {
          // Check if error was found
          if (err) {
            res.json({ success: false, message: 'Something went wrong.' }); // Return error message
          } else {
            // Check if id of user in session was found in the database
            if (!user) {
              res.json({ success: false, message: 'Could not authenticate user.' }); // Return error message
            } else {
              // Check if user who liked post is the same user that originally created the blog post
              //   if (user.userId === blog.OwnerId) {
              //     res.json({ success: false, messagse: 'Cannot like your own post.' }); // Return error message
              //   } else {
              // Check if the user who liked the post has already liked the blog post before
              if (blog.likedBy.includes(user.userId)) {
                res.json({ success: false, message: 'You already liked this post.' }); // Return error message
              } else {
                // Check if user who liked post has previously disliked a post
                if (blog.dislikedBy.includes(user.userId)) {
                  blog.dislikes--; // Reduce the total number of dislikes
                  const arrayIndex = blog.dislikedBy.indexOf(user.userId); // Get the index of the userid in the array for removal
                  blog.dislikedBy.splice(arrayIndex, 1); // Remove user from array
                  blog.likes++; // Increment likes
                  blog.likedBy.push(user.userId); // Add userid to the array of likedBy array
                  // Save blog post data
                  blog.save((err) => {
                    // Check if error was found
                    if (err) {
                      res.json({ success: false, message: 'Something went wrong.' }); // Return error message
                    } else {
                      res.json({ success: true, message: 'Blog liked!' }); // Return success message
                    }
                  });
                } else {
                  blog.likes++; // Incriment likes
                  blog.likedBy.push(user.userId); // Add liker's userid into array of likedBy
                  // Save blog post
                  blog.save((err) => {
                    if (err) {
                      res.json({ success: false, message: 'Something went wrong.' }); // Return error message
                    } else {
                      res.json({ success: true, message: 'Blog liked!' }); // Return success message
                    }
                  });
                }
              }
              //   }
            }
          }
        });
      }
    }
  });
}
});

router.put('/dislikePost', (req,res)=>{
   // Check if id was provided inside the request body
   if (!req.body.memeId) {
    res.json({ success: false, message: 'No id was provided.' }); // Return error message
  } else {
    // Search database for blog post using the id
    subjectModel.findOne({ MemeId: req.body.memeId }, (err, blog) => {
      // Check if error was found
      if (err) {
        res.json({ success: false, message: 'Invalid blog id' }); // Return error message
      } else {
        // Check if blog post with the id was found in the database
        if (!blog) {
          res.json({ success: false, message: 'That blog was not found.' }); // Return error message
        } else {
          // Get data of user who is logged in
          studentModel.findOne({ userId: req.body.userId }, (err, user) => {
            // Check if error was found
            if (err) {
              res.json({ success: false, message: 'Something went wrong.' }); // Return error message
            } else {
              // Check if user was found in the database
              if (!user) {
                res.json({ success: false, message: 'Could not authenticate user.' }); // Return error message
              } else {
                // Check if user who disliekd post is the same person who originated the blog post
                //   if (user.username === blog.createdBy) {
                //     res.json({ success: false, messagse: 'Cannot dislike your own post.' }); // Return error message
                //   } else {
                // Check if user who disliked post has already disliked it before
                if (blog.dislikedBy.includes(user.userId)) {
                  res.json({ success: false, message: 'You already disliked this post.' }); // Return error message
                } else {
                  // Check if user has previous disliked this post
                  if (blog.likedBy.includes(user.userId)) {
                    blog.likes--; // Decrease likes by one
                    const arrayIndex = blog.likedBy.indexOf(user.userId); // Check where userId is inside of the array
                    blog.likedBy.splice(arrayIndex, 1); // Remove userId from index
                    blog.dislikes++; // Increase dislikeds by one
                    blog.dislikedBy.push(user.userId); // Add userId to list of dislikers
                    // Save blog data
                    blog.save((err) => {
                      // Check if error was found
                      if (err) {
                        res.json({ success: false, message: 'Something went wrong.' }); // Return error message
                      } else {
                        res.json({ success: true, message: 'Blog disliked!' }); // Return success message
                      }
                    });
                  } else {
                    blog.dislikes++; // Increase likes by one
                    blog.dislikedBy.push(user.userId); // Add userId to list of likers
                    // Save blog data
                    blog.save((err) => {
                      // Check if error was found
                      if (err) {
                        res.json({ success: false, message: 'Something went wrong.' }); // Return error message
                      } else {
                        res.json({ success: true, message: 'Blog disliked!' }); // Return success message
                      }
                    });
                  }
                }
                //   }
              }
            }
          });
        }
      }
    });
  }
});

module.exports = router;