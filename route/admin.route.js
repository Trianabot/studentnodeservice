const express = require('express');
var router = express.Router();
const path = require('path');
const uniqid = require('uniqid');
const bodyParser = require('body-parser');
const multer = require('multer');
const subjectModel = require('../model/subjectData.model');
const sub_subject = require('../model/subject.model');
const courseCollection = require('../model/Cource.model');
const validateToken = require('../config/auth-token');
const config = require('../config/config');
const mkdirp = require('mkdirp');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = path.join(__dirname, "../mediafiles/")
        mkdirp(dir, err => callback(err, dir))
    },
    filename: function (req, file, callback) {
        const fileName = req.params.fileName;
        const ext = path.extname(file.originalname);
        const custFileName = fileName + ext;
        callback(null, custFileName);
    }
});

const fileFilter = (req, file, callback) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'video/mp4') {
        callback(null, true);
    } else {
        callback(new Error('please upload PNG/JPEG type files'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fieldSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});


// To upload vedio 
router.post('/savevedio/:fileName', upload.single("memefile"), (req, resp) => {
    //console.log("req,body",req.body);
    if (!req.body) {
        return res.status(400).send("Bad request");
    }
    const myHost = req.hostname;
    const portNumber = config.port;
    const port = process.env.port || portNumber;
    // const fileName = req.body.OwnerId+"_"+req.body.Title;
    const fileName = req.params.fileName;
    const ext = path.extname(req.file.originalname);
    const memeName = fileName + ext;
    let uniqId = uniqid();
    let Topic_Id = uniqid();
    let model = new subjectModel({
        MemeId: uniqId,
        Meme: memeName,
        OwnerId: req.body.loggedInUser,
        Cource: req.body.Cource,
        Subject: req.body.Subject,
        Topic: req.body.Topic,
        Topic_Id: Topic_Id
    });
    model.save()
        .then(doc => {
            if (!doc || doc.length === 0) {
                // console.log(moment(doc.CreatedOn).endOf('day').fromNow())
                return resp.status(500).send({
                    message: 'added 500',
                    data: doc
                });
            }
            resp.status(200).send({
                message: 'vedio successfully..!',
                data: doc
            });
        }).catch(error => {
            resp.status(500).send({
                message: 'Error while adding the meme',
                error: error
            });
        });
});

router.get('/getvideos', (req, res) => {
    subjectModel.find().then(data => {
        res.status(200).send({
            message: 'uploaded videos',
            data: data
        });
    }).catch(err => {
        res.status(500).send({
            message: 'Error while getting videos',
            err: err
        });
    })
});

// To add subject
// router.post('/addsubject',(req, resp)=>{
//      if(!req.body){
//          return res.status(400).send("Bad request");
//      }
//      let model =new sub_subject({
//         discription:req.body.discription,
//         type : req.body.type,
//         sub_type:req.body.sub_type,
//         topics:req.body.topics,
//      });
//      model.save()
//      .then(doc=>{
//          if(!doc || doc.length === 0){
//              return resp.status(500).send({
//                  message : 'subject added 500',
//                  data:doc
//              });
//          }
//          resp.status(200).send({
//              message : 'subject successfully..!',
//              data : doc
//          });
//      }).catch(error=>{
//          resp.status(500).send({
//              message : 'Error while adding the meme',
//              error : error
//          });
//      });
//  });

router.post('/getvideosbytype', (req, res) => {
    sub_subject.find({ type: req.body.type }).then(data => {
        res.status(200).send({
            message: 'uploaded videos',
            data: data
        });
    }).catch(err => {
        res.status(500).send({
            message: 'Error while getting videos',
            err: err
        });
    })
});

//To get subject details
router.post('/getsubjectdetails', (req, res) => {
    sub_subject.find({ _id: req.body.id }).then(data => {
        res.status(200).send({
            message: 'uploaded videos',
            data: data
        });
    }).catch(err => {
        res.status(500).send({
            message: 'Error while getting videos',
            err: err
        });
    })
});


router.post('/getvideosbyselectedtype', (req, res) => {
    console.log("getvideosbyselectedtype", req.body);
    subjectModel.find({ type: req.body.type }).then(data => {
        res.status(200).send({
            message: 'uploaded videos',
            data: data
        });
    }).catch(err => {
        res.status(500).send({
            message: 'Error while getting videos',
            err: err
        });
    })
});

router.post('/getvideosUserId', (req, res) => {
    subjectModel.find({ type: req.body.type }).sort({ CreatedOn: -1 }).then(data => {
        res.status(200).send({
            message: 'uploaded videos',
            data: data
        });
    }).catch(err => {
        res.status(500).send({
            message: 'Error while getting videos',
            err: err
        });
    })
});

//To add cource

router.post('/addcource', (req, resp) => {
    if (!req.body) {
        return res.status(400).send("Bad request");
    }
    let cource_Id = uniqid();
    let model = new courseCollection({
        course: req.body.course,
        course_id: cource_Id,
    });
    model.save()
        .then(doc => {
            if (!doc || doc.length === 0) {
                return resp.status(500).send({
                    message: 'cource added 500',
                    data: doc
                });
            }
            resp.status(200).send({
                message: 'cource added successfully..!',
                data: doc
            });
        }).catch(error => {
            resp.status(500).send({
                message: 'Error while adding the cource',
                error: error
            });
        });
});

//To get cources 
router.get('/getcources', (req, res) => {
    courseCollection.find().then(data => {
        res.status(200).send({
            message: 'get cources',
            data: data
        });
    }).catch(err => {
        res.status(500).send({
            message: 'Error while getting cources',
            err: err
        });
    })
});

router.post('/addsubject', (req, res) => {
    let subid = uniqid();
    courseCollection.updateOne({ course: req.body.course }, {
        "$push": {
            subjects: {
                "$each": [{
                    subject: req.body.subject,
                    course: req.body.course,
                    subject_id: subid
                }], "$position": 0
            }
        }
    }, function (err, data) {
        if (!err) {
            res.status(200).send({ data: data, message: "data added subject" })
        }
        if (err) {
            res.status(400).send({ error: err, message: " err added subject" })
        }
    })
    // subjectObj.save().then(cc => { console.log('ccddddd:', cc); });
    // courseObj.save().then(cc => { console.log('cc:', cc); });

});

router.get('/getwholedata', () => {
    courseCollection.find().then(cc => { console.log('gftrjytdumy:', cc); });
})


//To get subjectById
router.post('/getsubjectbyid', (req, res) => {
    courseCollection.find({ course: req.body.course }).then(data => {
        res.status(200).send({
            message: 'get cources',
            data: data
        });
    }).catch(err => {
        res.status(500).send({
            message: 'Error while getting cources',
            err: err
        });
    })
});



module.exports = router;