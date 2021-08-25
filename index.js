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

    //Oauth Attached here
    app.post("/signin",(req,res)=>{
      res.redirect("mainpage.html")
    })


    app.post('/mainpage2',(req,res)=>{
      dbo.collection(collection).find({'PostTypeId':1}).toArray((err,result)=>{
        var ans = {
          'questions':result
        }
        dbo.collection(collection).find({'PostTypeId':2}).toArray((err,result)=>{
          ans.answers = result
          res.send(ans)
        })        
      })
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
        //console.log(result)
        for (i=0;i<result.length;i++)
        {
          //console.log(result[i].DisplayName)
          //console.log(result[i].DisplayName==name)
          if (result[i].DisplayName==name)     //DisplayName var in database
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
    
    app.post('/searchposts',(req,res)=>{
      var search_string = req.body.search_string
      var search_words = new Set(search_string.split(' '))
      let promise = Promise.resolve()

      var stop_words = ["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"]

      new Promise((resolve,reject)=>{
        stop_words.forEach(sw=>search_words.delete(sw))
        console.log('set is ')
        console.log(search_words)
        if(search_words.size==0)
        res.send('No Context in the Search Phrase')
        else
        resolve()
      }).then(()=>{
        var q_set = new Set()
        var a_set = new Set()
          request.get({
            headers:{'content-type':'application/json'},
            url:'http://localhost:8089/questions'
            },(err,response,body)=>{
            if(err) throw err
              //console.log(body)
              //console.log(typeof body)
            
              new Promise((resolve,reject)=>{
                search_words.forEach(word => {
                  console.log(word)
                  JSON.parse(body).filter((question) => {return (question.Title.indexOf(word) >= 0 || question.Body.indexOf(word) >= 0 )}).map((question) => {console.log('Hi');q_set.add(JSON.stringify(question))})
                })
                resolve()
              }).then(()=>{
                console.log(q_set)
  
                new Promise((resolve,reject)=>{
                  request.get({
                    headers:{'content-type':'application/json'},
                    url:'http://localhost:8088/answers'
                    },(err,response,body)=>{
                    if(err) throw err
          
                    
                    search_words.forEach(word=>{
                      JSON.parse(body).filter((answer)=>{return answer.Body.indexOf(word)>=0}).map((answer)=>a_set.add(JSON.stringify(answer)))
                    })
                  
                    resolve()
  
                          
                })
                
              }).then(()=>{
                console.log(a_set)
  
                var ans ={
                  'questions':Array.from(q_set).map((question)=>JSON.parse(question)),
                  'answers':Array.from(a_set).map((answer)=>JSON.parse(answer))
                }
                console.log(ans)
                res.send(ans)
              })
              
  
                  
      
  
              })
          })
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
      var p=-1
      var question = req.body.question
      question.replace("of","")
      question.replace("the","")
      question.replace("is","")
      question1=question.split(" ")
      console.log(question1)
      dbo.collection(collection).find({}).toArray(function(arr,result){  
        //console.log(result)      
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
                q.push({"Title":result[j].Title,"Body":result[j].Body})
                votes.push(result[j].Score)
                console.log("QUESTIONS")
                console.log(q)
                console.log("VOTES")
                console.log(votes)      
              }
            }
            //console.log("Questions and Votes over") 
          }      
        }
        //console.log("Answer begin")
        for (x=0;x<=p;x++)    //Answer array
        {
          var answer=[]
          /*for (i=0;i<result.length;i++)
          {
            if ((result[i].PostTypeId==2) && (par_id[x]==result[i].ParentId))
            {
              answer.push(result[i].Body)
            }
          }
          allanswer.push(answer)*/
          //console.log(allanswer)
         
          new Promise((resolve,reject)=>{
            request.post({
              headers:{"content-type":"application/json"},
              url:`http://localhost:8089/questions/${par_id[x]}/answers`
            },(err,response)=>{
              if(err) throw err
              console.log(x)
              console.log(par_id[x])
              console.log("Hello")
              console.log(response.body)
            })
            resolve()
          }).then(()=>{})
          

        } 
        
        dbo.collection(collection3).find({}).toArray(function(arr,result){  //Comments
          
          //console.log("Comments start")
          //console.log(result)
          for (x=0;x<=p;x++)
          {
            var c=[]
            for (i=0;i<result.length;i++)
            {
              if (par_id[x]==result[i].PostId)
              {
                c.push(result[i].Text)
              }              
            }
            comments.push(c)
          }
          //console.log("Comments end")
          //console.log("hi")
          //Comining questions, comments, votes and answer
          for (n=0;n<=p;n++)
          {
            var s={}
            s["question"]=q[n].Title
            s["body"]=q[n].Body
            s["answer"]=allanswer[n]
            s["votes"]=votes[n]
            s["comments"]=comments[n]
            //console.log(s)
            search.push(s)
          }        
        res.send(search)
        })
    })
   
    })
    app.get('/:posts/sort/:base/:type',(req,res)=>{
      var type = req.params.type
      var base = req.params.base
      var posts = req.params.posts
      var host_url;
      if(posts == 'questions')
      host_url='http://localhost:8089/questions'
      else if(posts == 'answers')
      host_url='http://localhost:8088/answers'
      request.get({
        headers:{'content-type':'apllication/json'},
        url:host_url
      },(err,response,body)=>{
        var questions = JSON.parse(body)
        if(err) throw err
        new Promise((resolve,reject)=>{
          if(type == 'desc')
          questions.sort((q1,q2)=>q2[base] - q1[base])
          else if(type == 'asc')
          questions.sort((q1,q2)=>q1[base] - q2[base])

          console.log(questions)
          
          resolve()
        }).then(()=>{
          res.send(questions)
        })
      })
    })
    app.get('/trending',(req,res)=>{
      request.get({
        headers:{'content-type':'application/json'},
        url:'http://localhost:8087/questions/sort/Score/desc'
      },(err,response,body)=>{
        res.send(JSON.parse(body))
      })
    })
})
var server = app.listen(8087,function(){
    console.log("server started")
})