const express= require('express');
const router = express.Router();
const studentModel = require('../model/student.model');
const SimpleCrypto = require("simple-crypto-js").default;
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
             // generateConfirmationEmail(req, res, userdata);
             res.status(200).send({ message:"mail sent to admin to verify your account " });
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
  studentModel.findOneAndUpdate({ emailId: req.body.emailId }, {
    $set: { isVerified:req.body.isVerified }
  }, { new: true }, (error, userDoc) => {

    if(!error){
      studentModel.findOne({ emailId: req.body.emailId }, (error, userDoc) => {
        if (error) throw error;
      
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
        
        var mailOptions = {
          from: 'stomachcrew@gmail.com',
          to: req.body.emailId,
          subject: 'Account Verified Successfully',
          template: 'emails_body',
          context: {
            host: req.headers.host,
            port: config.port,
            emailId:req.body.emailId,
           url: 'http://' + config.redirectUrl +  '/#/studentlogin/' + req.body.emailId
          }
        
        };
      
        transporter.sendMail(mailOptions, function (err) {
          if (err) { return res.status(500).send({ msg: err.message }); }
          res.status(200).send({ message: 'Login url send to student mail id as per registartion .' + req.body.emailId + '.' });
        });
      });
    }
    if(error){
      res.status(400).send({message:"error while verifying student account"})
    }
})
});

//To update password(26/07/2019:monika)
router.post('/logout', function (req, res) {
  
  studentModel.findOneAndUpdate({ emailId: req.body.emailId }, { $set: { isActive: req.body.isActive } }, { new: true }, (error, userDoc) => {
    if (error) throw error;
    return res.status(200).send({ userDoc: userDoc, message: 'logout successfully' });
  });
});



module.exports = router;