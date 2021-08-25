var express = require('express')
var bodyParser = require('body-parser')
var express=require('express')
var app = express()
var bodyParser = require("body-parser")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
//var cors = require('cors')
//var app = express()

app.use(bodyParser.urlencoded({
    extended:true
}));
var server = app.listen(5050,()=>{
    console.log(' Server Started')
})

var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://127.0.0.1:27017'
//var url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority'
var db_name = 'skillenhancement'
var col_name_q = 'questionAnswer'
var col_name_u = 'user'

var validate_user = require('./authorize')

MongoClient.connect(url,(err,db)=>{
    if(err)throw err
    dbo = db.db(db_name)

    console.log('Database Connected')

    var q_counter;
    var initial_q_counter

    dbo.collection('globals').find({}).toArray((err,result)=>{
        console.log(result)
        q_counter = result[0].q_num
        initial_q_counter = q_counter

        console.log(q_counter)

    function cleanup(){
        dbo.collection('globals').updateOne({'q_num':initial_q_counter},{$set:{'q_num':q_counter}},(err,result)=>{
            console.log('Server Closed')
            process.exit(1)

        })
    }

    process.on('exit',cleanup)
    process.on('SIGINT',cleanup)

    //get complete user details from id
    app.get('/users/:user_id',(req,res)=>{
        var user_id = parseInt(req.params.user_id)
        console.log(user_id)
        console.log(typeof user_id)

        dbo.collection('user').find({'Id':user_id}).toArray((err,result)=>{
            console.log(result)
            console.log(result.length)
            if(result.length >= 1)
                {
                    var user = result[0]
                    dbo.collection(col_name_u).findOne({'Id':user_id},(err,result)=>{
                        if(err) throw err
                        console.log(result)
                        res.send(JSON.stringify(user))
                    })
                    
                }
            else
                {
                   res.send('Invalid Details')
                }
        })
    })

    //post complete user details 
    app.post('/api/signup', (req,res)=>{

        var p = req.body.password
        var pc = req.body.passwordConformation
        var Id = req.body.Id 
        var un = req.body.username 
        var e = req.body.email 
        var g = req.body.gender 
        var s = req.body.socialLink 

        console.log(Id)
        console.log(p)
        console.log(pc)    
        console.log(g)    
        
        dbo.collection('user').find({'Id':Id}).toArray((err,result)=>{
            console.log(result.length)
                if (result.length==0)
                {
                var u_obj={
                    role:"user",
                    Id:Number(Id),
                    username:un,
                    password:p,
                    grade:0,
                    email:e,
                    gender:g,
                    socialLink:s,
                    profilePhoto:"https://secure.gravatar.com/avatar/6123d8d55f9cc322bc7ef0f0?s=90&d=ide...",
                    CreationDate:Date()
                }

                dbo.collection(col_name_u).insertOne(u_obj,(err,result)=>{
                    if(err) throw err
                    console.log(result)
                    //console.log('User Added')
                    res.send('User Added')
                    //res.redirect('/')
                })                    
            }
            else{
                res.send('User already Exists')
            }
        })
    })

    // edit user profile
    app.patch('/api/users/:user_id/editprofile', (req,res)=>{

        //only owner
        var user_id = parseInt(req.params.user_id)
        var p = req.body.password
        //var pc = req.body.passwordConformation
        var un = req.body.username 
        var e = req.body.email 
        var g = req.body.gender 
        var s = req.body.socialLink 

        console.log(p)
        //console.log(pc)    
        console.log(g)    
        
        dbo.collection('user').find({'Id':user_id}).toArray((err,result)=>{
            console.log(result.length)
                if (result.length==1)
                {
                var u_obj={
                    username:un,
                    password:p,
                    email:e,
                    gender:g,
                    socialLink:s,
                    profilePhoto:"https://secure.gravatar.com/avatar/6123d8d55f9cc322bc7ef0f0?s=90&d=ide...",
                }
                dbo.collection(col_name_u).updateOne({"Id":Number(user_id)},{$set:u_obj},(err,result)=>{
                    console.log(result)
                    res.send(JSON.stringify(result))

                })
              
            }
            else if (result.length == 0)
            {
                res.send('User Doesn\'t Exist')
            }
            else
            {
                res.send('Updation Failed, please contact admin')
            }
        })
    })

     //delete user profile
     app.delete('/users/:user_id/delete',(req,res)=>{
        var user_id = parseInt(req.params.user_id)
        console.log(user_id)
        console.log(typeof user_id)

        dbo.collection('user').find({'Id':user_id}).toArray((err,result)=>{
            console.log(result.length)
                if (result.length==1)
                {
                    dbo.collection(col_name_u).deleteOne({'Id':user_id},(err,result)=>{
                        console.log(result)
                        res.send(JSON.stringify(result))
                    })
                }
                else if (result.length==0)
                {
                    res.send("User ID doesn\'t exist. User is may be already deleted")
                }
    })
})   


    //get all the questions asked by the user
    app.get('/users/:user_id/questions',(req,res)=>{
        var user_id = parseInt(req.params.user_id)
        console.log(user_id)
        console.log(typeof user_id)

        dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':1}).toArray((err,result)=>{
            console.log(result)
            console.log(result.length)
            if(result.length >= 1)
                {
                    var user = result
                    dbo.collection(col_name_q).findOne({'OwnerUserId':user_id, 'PostTypeId':1},(err,result)=>{
                        if(err) throw err
                        console.log(result)
                        res.send(JSON.stringify(user))
                    })
                    
                }
            else
                {
                   res.send('You have not asked any questions yet')
                }
        })
    })


    //get all the comments made by the user
    app.get('/users/:user_id/comments',(req,res)=>{
        var user_id = parseInt(req.params.user_id)
        console.log(user_id)
        console.log(typeof user_id)
        dbo.collection('comments').find({'Id':user_id}).toArray((err,result)=>{
            console.log(result)
            console.log(result.length)
            if(result.length >= 1)
            {
                var user = result
                dbo.collection('comments').findOne({'Id':user_id},(err,result)=>{
                    if(err) throw err
                    console.log(result)

                    res.send(JSON.stringify(user))
                })
                
            }
            else if (result.length == 0)
            {
               res.send('You have not commented any questions yet')
            }
            else 
            {
               res.send('Failed to load, please contact admin')
            }
        })
    })

    //get total number of questions posted by the user
    app.get('/users/:user_id/totalquestions',(req,res)=>{
        var user_id = parseInt(req.params.user_id)
        console.log(user_id)
        console.log(typeof user_id)

        dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':1}).toArray((err,result)=>{
            console.log(result)
            console.log(result.length)
            res.send(JSON.stringify(result.length))
        })
    })

    //get total number of comments posted by the user
    app.get('/users/:user_id/totalcomments',(req,res)=>{
        var user_id = parseInt(req.params.user_id)
        console.log(user_id)
        console.log(typeof user_id)

        dbo.collection('comments').find({'Id':user_id}).toArray((err,result)=>{
            console.log(result)
            console.log(result.length)
            res.send(JSON.stringify(result.length))
        })
    })
        
    //get total number of answered posted by the user
    app.get('/users/:user_id/totalanswers',(req,res)=>{
        var user_id = parseInt(req.params.user_id)
        console.log(user_id)
        console.log(typeof user_id)

        dbo.collection('questionAnswer').find({'Id':user_id, 'PostTypeId':2}).toArray((err,result)=>{
            console.log(result)
            console.log(result.length)
            res.send(JSON.stringify(result.length))
        })
    })
        
        
    })

    //get all the answers posted by the user
    app.get('/users/:user_id/answers',(req,res)=>{
        var user_id = parseInt(req.params.user_id)
        console.log(user_id)
        console.log(typeof user_id)

        dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':2}).toArray((err,result)=>{
            console.log(result)
            console.log(result.length)
            if(result.length >= 1)
                {
                    var user = result
                    dbo.collection(col_name_q).findOne({'OwnerUserId':user_id, 'PostTypeId':2},(err,result)=>{
                        if(err) throw err
                        console.log(result)
                        res.send(JSON.stringify(user))
                    })
                    
                }
            else
                {
                   res.send('You have not answered any quesions yet')
                }
        })
    })

    app.get('/users',(req,res)=>{
        dbo.collection('user').find().toArray((err,result)=>{
            if(err) throw err
            console.log(result)
            console.log(result.length)
            if(result.length >= 1)
                {
                        res.send(JSON.stringify(result))                    
                }
            else
                {
                   res.send('No users to display')
                }
        })

    })

    app.get('/tags',(req,res)=>{
    })


})

