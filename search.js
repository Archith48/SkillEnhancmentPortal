var MongoClient=require('mongodb').MongoClient
var express=require('express')
var request = require('request')
var app = express()
var bodyparser = require("body-parser")
//var url="mongodb://127.0.0.1:27017/";
var url="mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority"
//var mydb="SkillEnhancementPortal"
var mydb="skillenhancement"
//var collection="question"
var collection="questionAnswer"
var collection2="user"
var collection3="comments"
var username=""
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))

MongoClient.connect(url,function(err,db){
    if(err)
      throw err
    dbo=db.db(mydb)
    console.log(dbo)

    app.post("/signin",(req,res)=>{
      res.redirect("mainpage.html")
    })

    app.post("/mainpage",(req,res)=>{
      dbo.collection(collection).find({}).toArray(function(arr,result){
          console.log(typeof(result))

          var question=[]
          var message=[]
          var votes=[]
          var questiondetails=[]
          var count=0
          for (i=0;i<result.length;i++)
          {
            if (result[i].PostTypeId==1)
            {
              count=count+1
              question.push(result[i].Title)
              message.push(result[i].Body)
              votes.push(result[i].Score)
            }
          }
          for (i=0;i<count;i++)
          {
            var qa={}
            qa["question"]=question[i]
            qa["message"]=message[i]
            qa["votes"]=votes[i]
            questiondetails.push(qa)
          }
          res.send(questiondetails)
          //res.send(JSON.stringify(result))
      })
    })

    app.post("/searchuser",(req,res)=>{
      var name=(req.body.searchname).split(":")[1]
      console.log(name)
      var users=[]    //holds id of user's name
      var searchuser={}
      var question=[]
      var answer=[]
      dbo.collection(collection2).find({}).toArray(function(arr,result){
        console.log(result)
        for (i=0;i<result.length;i++)
        {
          //console.log(result[i].DisplayName)
          //console.log(result[i].DisplayName==name)
          if (result[i].username==name)     //DisplayName var in database
          {
            users.push(result[i].Id)
          }
        }
        console.log(users)
      })
      dbo.collection(collection).find({}).toArray(function(arr,result){
        console.log(result)
        for (i=0;i<users.length;i++)
        {
          questions_count=0
          answer_count=0
          for (j=0;j<result.length;j++)
          {
            if (users[i]==result[j].OwnerUserId)
            {
               if (result[j].PostTypeId==1)
               {
                 questions_count=questions_count+1
                 //question[i]=result[j].Title
               }
               if (result[j].PostTypeId==2)
               {
                 answer_count=answer_count+1
                 //answer.push(result[j].Body)
               }

            }
          }
          searchuser[users[i]]=[questions_count,answer_count]
          console.log(searchuser)
        }
        res.send(searchuser)
      })
    })

    app.post("/searchquestion",(req,res)=>{
      var search=[]
      var par_id=[]
      var q=[]
      var a=[]
      var votes=[]
      var comments=[]
      var allanswer=[]
      var answer=[]
      var p=-1
      var question = req.body.question
      question.replace("of","")
      question.replace("the","")
      question.replace("is","")
      question1=question.split(" ")
      console.log(question1)
      dbo.collection(collection).find({}).toArray(function(arr,result){  
        console.log(result)      
        for (i=0;i<question1.length;i++)
        {
          for (j=0;j<result.length;j++)
          {
            //console.log("Begin")
            //console.log("Next j="+j)
            if (result[j].PostTypeId==1)
            {
              //console.log("Id="+result[j].PostTypeId)
              //console.log(typeOf(result[j].PostTypeId))
              //console.log(result)
              //console.log(result[j])
              //console.log((result[j].Title).indexOf(question[i]))
              //console.log((result[j].Body).indexOf(question[i]))
              //console.log((par_id.indexOf(result[j].Id))==-1)
              if (((((result[j].Title).indexOf(question1[i]))>-1)||(((result[j].Body).indexOf(question1[i]))>-1))&&((par_id.indexOf(result[j].Id))==-1))
              {
                //console.log("second j="+j)
                
                p=p+1
                par_id.push(result[j].Id)
                //console.log("ID="+par_id)
                q.push(result[j])    
              }
            }
            //console.log("Questions and Votes over") 
          }      
        }
        //console.log("Answer begin")
        //console.log(p)
        /*for (i=0;i<=p;i++)
        {
           console.log(par_id[i])
        }*/
       for (x=0;x<=p;x++)    //Answer array
        {
          var answer=[]
          var flag=0
          for (i=0;i<result.length;i++)
          {
            if ((result[i].PostTypeId==2) && (par_id[x]==result[i].ParentId))
            {
                answer.push(result[i])
                flag=1
            }
          } 
          //allanswer.push(answer)
        } 
        if(flag==0)
        {
          answer.push("")
        }

        dbo.collection(collection3).find({}).toArray(function(arr,result){  //Comments
        for (x=0;x<=p;x++)    //Comments array
        {
          var c=[]
            for (i=0;i<result.length;i++)
            {
              if (par_id[x]==result[i].PostId)
              {
                c.push(result[i])
              }              
            }
            //comments.push(c)
          //console.log(search) 
        }        
        //Combining questions, comments, votes and answer
        for (n=0;n<=p;n++)
        {
          var s={}
          s["question_votes"]=q[n]
          s["answer"]=answer[n]
          s["comments"]=c[n]
          //console.log(s)
          search.push(s)
        }        
      res.send(search)
        })
    })
})
   
})
var server = app.listen(8087,function(){
    console.log("server started")
})