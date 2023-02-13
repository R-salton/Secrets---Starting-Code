//jshint esversion:6
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');


const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

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
    password: String
});
const secret = process.env.SECRET;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

// USER MODEL
const Users = mongoose.model('User', userSchema);



app.get('/',(req,res) =>{
    res.render('home')
})

app.get('/register',(req,res) =>{
    res.render('register')
})

app.get('/login',(req,res) =>{
    res.render('login')
})


// REGISTER USER
app.post('/register', (req, res) =>{

const username = req.body.username;
const password = req.body.password;
 Users.findOne({email: username}, function(err, foundUser){
    if(err){
        console.log(err);
    } else if(foundUser){
       console.log("user exist");
       res.render('register'); 
    }
    else{

        const user = new Users({
            email: username,
            password: password
        });
        user.save(function(err){
            if(err){
                console.log(err);
            } else{
                res.render('secrets')
            }
        })
    }
 })
            
           
});

// USER LOGIN

app.post('/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    Users.findOne({email: username}, function(err, foundUser){
        if(err){
            console.log(err);
        } else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render('secrets');
                }
            }
        }
    })
});


app.listen(3000,function(){
    console.log('====================================');
    console.log('Server started on port 3000');
    console.log('====================================');
})