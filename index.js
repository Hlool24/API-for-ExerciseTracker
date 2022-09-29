const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const {ObjectId}= mongoose.Types;
const dburl= 'mongodb+srv://user-1:1234@cluster0.dlmck.mongodb.net/ExerciseTracker?retryWrites=true&w=majority';


const port = process.env.PORT || 3000;
//connect to database
mongoose.connect(dburl)
.then(result => {
  app.listen(port, () => {
    console.log('Your app is listening on port ' + port)
  })
})
.catch(err => console.log(err))

//users schema
const usersSchema = new mongoose.Schema({
  username:String
})

const users = mongoose.model('users', usersSchema)

//exercise schema
const exerciseSchema = new mongoose.Schema({
  username:String,
  count:Number,
  log:Array

})

const exercises = mongoose.model('exercises', exerciseSchema)


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', (req,res) => {
  const username = req.body.username;
  
  const newUser = new users({
    username
  })

  newUser.save()
  .then(result => res.status(200).json(result))
  .catch(err => console.log(err))

})


app.get('/api/users', (req,res) => {
  
  users.find()
  .then(result => res.status(200).json(result))
  .catch(err => console.log(err))

})


app.post('/api/users/:_id/exercises', (req,res) => {
  let {description, duration , date} = req.body;
  const id = req.params._id;
  duration=parseInt(duration)

  if(date)
 { 
    const date1= new Date(date)
    date = date1.toDateString()
  }
  else 
  {
    const date1=new Date()
    date = date1.toDateString()
  }


  exercises.findOneAndUpdate({_id:ObjectId(id)},{$push: {log:{description,duration,date}}, $inc: {count:1}})
  .then(result => {

    if(result)
    {
       res.status(200).json({"_id":result._id,"username":result.username, date, "duration":parseInt(duration),description})
    }
    else
    {
      users.findOne({_id:ObjectId(id)})
      .then(result => {
        if(!result)
        res.status(401).json({user: "user Not found"})

        const createNew = new exercises({
          _id:result._id,
          username:result.username,
          count:1,
          log:{description,duration,date}
        })
 
        createNew.save()
        .then(result => res.status(200).json({"_id":result._id,"username":result.username, date, "duration":parseInt(duration),description}))
        .catch(err => console.log(err))
      })
      .catch(err => console.log(err))
    }
  })
  .catch(err => console.log(err))
  
})

app.get('/api/users/:_id/logs', (req,res) => {
  const id= req.params._id;
  let {from, to, limit} = req.query;

  if(from){
    from= new Date(from)
    from= from.getTime();
  }
  if(to){
    to= new Date(to)
    to= to.getTime()
  }
  if(limit){
    limit= parseInt(limit)
  }

  exercises.findOne({_id: ObjectId(id)})
  .then(result => {
    let logs=result.log
     
    if(limit){
      logs=logs.slice(0,limit)
    }
    if(from || to){
      logs.map(i =>{
        let date=new Date(i.date) 
        
        if(date.getTime()<from || date.getTime()>to)
        {
          logs= logs.slice(logs.indexOf(i),logs.indexOf(i)+1)
        }
        })
    }
    res.status(200).json({"_id":result._id,"username":result.username,"count":result.count,"log":logs})
  
  })
  .catch(err => console.log(err))

})