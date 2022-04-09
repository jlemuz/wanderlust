const router = require('express').Router();
const sequelize = require('../config/connection');
const { Post, User} = require('../models');
const withAuth = require('../utils/auth');

const path = require("path");
const util = require("util");

// get all posts for dashboard
router.get('/', withAuth, (req, res) => {
  console.log(req.session);
  console.log('======================Get Images');
  Post.findAll({
    where: {
      user_id: req.session.user_id
    },
    attributes: [
      'id',
      'post_url',
      'title',
      'created_at',
      'image'
    ],
    order: [['created_at', 'DESC']],
    include: [
      {
        model: User,
        attributes: ['username']
      }
    ]
  })
    .then(dbPostData => {
      const posts = dbPostData.map(post => post.get({ plain: true }));
      res.render('dashboard', { posts, loggedIn: true });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/edit/:id', withAuth, (req, res) => {
  Post.findByPk(req.params.id, {
    attributes: [
      'id',
      'post_url',
      'title',
      'created_at'
    ],
    include: [
      {
        model: User,
        attributes: ['username']
      }
    ]
  })
    .then(dbPostData => {
      if (dbPostData) {
        const post = dbPostData.get({ plain: true });
        
        res.render('edit-post', {
          post,
          loggedIn: true
        });
      } else {
        res.status(404).end();
      }
    })
    .catch(err => {
      res.status(500).json(err);
    });
});

router.post('/', withAuth, async (req,res)=>{ 
  console.log('======================Posting Image');
  try{
      const file = req.files.file;
      //console.log(file);
      const fileName = file.name;
      const size = file.data.length;
      const extension = path.extname(fileName);
      const img = file.data.toString('base64');

      const allowedExtensions = /png|jpeg|jpg|gif/;

      if (!allowedExtensions.test(extension)) throw "Unsupported extension!";
      if (size > 5000000) throw "File must be less than 5MB";


      //const md5 = file.md5;
      //const URL = "/uploads/" + md5 + extension;

     // await util.promisify(file.mv)("./public" + URL);
    

      Post.create({
        title: fileName,
        // image: file.data
        post_url: fileName,
        user_id: req.session.user_id,
        image:img
      })
        .then(()=>{res.redirect('/dashboard');})
        .catch(err => {
          console.log('error inside post.create', err);
          res.status(500).json(err);
        });
      
      }
      catch(err){
        console.log('error in try catch',err);
        res.status(500).json({
            message: err,
        })
    }
});

router.delete('/:id', withAuth, (req, res) => {
  console.log('id', req.params.id);
  Post.destroy({
    where: {
      id: req.params.id
    }
  })
    .then(dbPostData => {
      if (!dbPostData) {
        res.status(404).json({ message: 'No post found with this id' });
        return;
      }
      res.json(dbPostData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});


module.exports = router;
