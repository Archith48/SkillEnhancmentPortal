var MongoClient=require('mongodb').MongoClient
var url="mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/test"
var mydb="skillenhancement"
var commentCollection="comments"
var postsCollection = "questionAnswer"
var userCollection = "user"
var collection = "globals"


var express=require('express')
var app = express()
var bodyparser = require("body-parser")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.set("view engine","jade")

var commentId
var comment = []
var count = 0
var user

var validate_user = require('./authorize')
var get_token = require('./authorize')

app.listen(8075,function(){
    console.log("Server started")
})

MongoClient.connect(url,function(err,db){
    if(err) throw err
    dbo=db.db(mydb)
    dbo.collection(collection).find({}).toArray(function(err,result){
        commentId = result[0]["c_num"]
        console.log(commentId)
    })

    //Get comments on the posts (question or answer) identified by a set of ids
    app.get(["/questions/:ids/comments","/answers/:ids/comments"],(req,res)=>{
        var ids = JSON.parse(req.params["ids"])
        var comments

        // run().then(()=>{
        //     console.log(comment)
        //     comments = comment
        //     comment=[]
        //     res.send(comments)
        // })
        new Promise((resolve, reject)=>{
            
            ids.forEach(id=>{
                new Promise((resolve,reject)=>{
                    dbo.collection(commentCollection).find({"PostId":id}).toArray(function(err,result){
                        if (err) 
                            throw err
                        else if (result.length == 0){
                            comment = ["Invalid Comment Id"]
                        }
                        else {
                            comment.push(result)
                        }
                    })
                    resolve()
                }).then(()=>{})
            })
        resolve()
    }).then(()=>{
            console.log(comment)
            comments = comment
            comment=[]
            res.send(comments)
        })

        // async function run(){
        //         ids.forEach(id=>{
        //         dbo.collection(commentCollection).find({"PostId":id}).toArray(function(err,result){
        //             if (err) 
        //                 throw err
        //             else if (result.length == 0){
        //                 comment = ["Invalid Comment Id"]
        //             }
        //             else {
        //                 result.forEach(ele=>{
        //                     comment.push(ele)
        //                 })
        //             }
        //         })
        //     })
        // }
    })

    //Get comments on the posts (question or answer) identified by a id
    app.get(["/question/:id/comments","/answer/:id/comments"],(req,res)=>{
        var id = Number(req.params["id"])
        console.log(id)
        dbo.collection(commentCollection).find({PostId:id}).toArray(function(err,result){
            if (err) throw err
            else res.send(result)
        })
    })

    //Create a new comment on the post identified by id
    app.post(["/questions/:id/comments/add","/answers/:id/comments/add"],(req,res)=>{
        //auth required
        var id = Number(req.params["id"])
        var commentObj={
            "Id": commentId+1,
            "PostId": id,
            "Score":0,
            "Text":req.body.body,
            "CreationDate": Date.now(),
            "Score":0,
            "UserDisplayName": req.headers.username,
            "UserId":Number(req.headers.userid)
        }
        dbo.collection(commentCollection).insertOne(commentObj,function(err,result){
            if (err) throw err
            else console.log(result)
        })
        res.end()
    })

    //Edit a comment identified by its id
    app.patch("/comments/:id/edit",(req,res)=>{
        //auth required
        //Only owner
        var token = req.headers['x-access-token']
        var id = Number(req.params["id"])
        if (token == null) res.redirect("/login")
        else{
            dbo.collection(userCollection).find({"token":token}).toArray(function(err,result){
                if (err) throw err
                else if(result.length == 1 && validate_user(token,result[0])){
                    user = result[0]
                    dbo.collection(commentCollection).find({"Id":id}).toArray(function(err,result){
                        if (result.length==1 && result[0].UserId == user.Id){
                            dbo.collection(commentCollection).updateOne({"Id":id},{$set:{"Text":req.body.body,"CreationDate":Date.now()}})
                            res.end()
                        }
                        else res.send("No access to edit the comment")
                    })
                }
                else res.send("No access to edit the comment")
            })
        }
    })

    //Delete comment identified by its id
    app.delete("/comments/:id/delete",(req,res)=>{
        //auth required
        //Only owner
        var token = req.headers['x-access-token']
        var id = Number(req.params["id"])
        if (token == null) res.redirect("/login")
        else{
            dbo.collection(userCollection).find({"token":token}).toArray(function(err,result){
                if (err) throw err
                else if(result.length == 1 && validate_user(token,result[0])){
                    user = result[0]
                    dbo.collection(commentCollection).find({"Id":id}).toArray(function(err,result){
                        if (result.length==1 && result[0].UserId == user.Id){
                            dbo.collection(commentCollection).deleteOne({Id:id})
                            res.end()
                        }
                        else res.send("No access to delete the comment")
                    })
                }
                else res.send("No access to delete the comment")
            })
        }
    })

    //Casts an upvote on the given comment.
    app.patch("comments/:id/upvote",(req,res)=>{
        //auth required
        var token = req.headers['x-access-token']
        var id = Number(req.params["id"])
        if (token == null) res.redirect("/login")
        else{
            dbo.collection(commentCollection).find({Id:id}).toArray(function(arr,result){
                var score = result[0]["Score"]
                dbo.collection(commentCollection).updateOne({"Id":Number(id)},{$set:{"Score":score+1}})
            })
            res.end()
        }
    })

    //Downvote a given comment && Undo an upcomment
    app.patch(["comments/:id/downvote", "comments/:id/upvote/undo"],(req,res)=>{
        //auth required
        var token = req.headers['x-access-token']
        var id = Number(req.params["id"])
        if (token == null) res.redirect("/login")
        else{
            dbo.collection(commentCollection).find({Id:id}).toArray(function(arr,result){
                var score = result[0]["Score"]
                dbo.collection(commentCollection).updateOne({"Id":Number(id)},{$set:{"Score":score-1}})
            })
            res.end()
        }
    })

    //Get the comments posted by the users identified id
    app.get(["/users/:id/comments"],(req,res)=>{
        var id = Number(req.params["id"])
        console.log(id)
        dbo.collection(commentCollection).find({UserId:id}).toArray(function(err,result){
            if (err) throw err
            else res.send(result)
        })
    })
})
// var http = require('http');

// var options = {
//     host: 'google.com',
//     path: 'http://localhost:8075/questions/4/comments'
// }

// var request = http.request(options, function (res) {
//     var data = '';
//     res.on('data', function (chunk) {
//         data += chunk;
//     })
//     console.log(data)
// })
// console.log(request)