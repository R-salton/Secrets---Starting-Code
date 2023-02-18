//jshint esversion:6
require('dotenv').config();
const md5 = require('md5')
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// const encrypt = require('mongoose-encryption');
// const bcrypt = require('bcrypt')
// const saltRounds = 12;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: 'ourSecrete',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());

app.use(passport.session());

//======= MONGODB CONNECTION ========= //
mongoose.set('strictQuery', true)
mongoose.connect('mongodb://127.0.0.1:27017/users', (err) =>{
    if (err) {
        console.log(err);
    } else{
        console.log('==== Successfully Connected To MongoDb ====');
    }
})

// USER SCHEMA
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// ENCRYPTING OUR DATA WITH Mongoose-encryption

// const secret = process.env.SECRET;
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

// USER MODEL
const Users = mongoose.model('User', userSchema);

passport.use(Users.createStrategy());
// passport.serializeUser(Users.serializeUser());
// passport.deserializeUser(Users.deserializeUser());

passport.serializeUser(function(Users, done) {
    done(null, Users);
  });
  
  passport.deserializeUser(function(id, done) {
    Users.findById(id, function(err, user){

        done(err, user);
    })
  });


  // GOOGLE AUTH

  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secretes"
  },
  function(accessToken, refreshToken, profile, cb) {
    
    Users.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/',(req,res) =>{
    res.render('home')
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));


  app.get('/auth/google/secretes', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.get('/register',(req,res) =>{
    res.render('register')
})

app.get('/login',(req,res) =>{
    res.render('login')
})

app.get('/secrets', function(req,res){
   
    Users.find({secret: {$ne: null}}, function(err, foundUsers){
        if(err){
            console.log(err)
        }
        else{
            res.render('secrets',{foundUsers: foundUsers})
        }
    })
})

// GET SUBMIT REQUEST FRO USER

app.get('/submit', function(req, res)
{
     if(req.isAuthenticated()){
        res.render("submit")
     } else(
        res.redirect('/login')
     )

})

app.post('/submit', function(req, res){
    const secret = req.body.secret;
    Users.findById(req.user._id, function(err, foundUser)
    {
        if(err)
        { 
            console.log(err)
        }
        else
        {
            foundUser.secret = secret;
            foundUser.save();
            res.redirect('/secrets')
        }
    }
    )
    // Users.findById(req.)
})

// REGISTER USER
app.post('/register', (req, res) =>{

    Users.register({username: req.body.username}, req.body.password, function(err, registeredUser){
        if(err){
            console.log(err);
            res.redirect('/register');
        } else{
            passport.authenticate('local')(req, res, function(){
                res.redirect('/secrets');
            });
        }
    })


});

            
        

// USER LOGIN

app.post('/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    const newUser = new Users({
        email: username,
        password: password
    });
    req.login(newUser, function(err){
        if(err){
            console.log(err)
        } else{
            passport.authenticate('local')(req, res, function(){
                res.redirect('secrets')
            })
        }
    })

    
});


// LOGOUT USER ROUTE
app.get('/logout', function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err)
        }
    });
    res.redirect('/')
;})

app.listen(3000,function(){
    console.log('====================================');
    console.log('Server started on port 3000');
    console.log('====================================');
})