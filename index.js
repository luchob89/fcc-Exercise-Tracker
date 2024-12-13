const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose')
const bodyParser = require('body-parser');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({ extended: false }));

/* db Code */
mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  username: String,
  exercises: [{
    description: String,
    duration: Number,
    date: String
  }]
});

const User = mongoose.model('User', userSchema);

// Create User POST endpoint
app.post('/api/users', async (req, res, next) => {
  try {
    
    const newUser = new User({ username: req.body.username });
  
    const result = await newUser.save();

    return res.json({
      username: result.username,
      _id: result._id
    })

  }
  catch (err) {
    console.error(err)
  }
})

// Users GET endpoint: returns an array of all the users with "username" and "_id" fields only
app.get('/api/users', async (req, res) => {

  const queryResult = await User.find({}, 'username _id').exec();

  return res.json(queryResult)
})

// Users POST create new exercise for 1 user
app.post('/api/users/:_id/exercises', async (req, res) => {

  let date = new Date().toDateString();

  // Had to add 1 day extra because of timezone difference
  if ( req.body.date ) {
    let dateFix = new Date(req.body.date);
    let plusOneDay = dateFix.setDate(dateFix.getDate() + 1);
    date = new Date(plusOneDay).toDateString();
  }

  const addExercise = await User.findByIdAndUpdate(req.params._id, {
    $push: { 
      exercises: {
        description: req.body.description,
        duration: req.body.duration,
        date: date
      }
    }
  })

  // Response
  return res.json({
    username: addExercise.username,
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: date,
    _id: req.params._id
  })
})

// GET all exercises from specific user
app.get('/api/users/:_id/logs', async (req, res) => {

  const userExercises = await User.findById(req.params._id).exec();

  // Query parameters handler
  const { to, from, limit} = req.query;
  if ( from ) userExercises.exercises.filter( exercise => exercise.date > new Date(from).toDateString() )
  if ( to ) userExercises.exercises.filter( exercise => exercise.date < new Date(to).toDateString() )
  if ( limit ) userExercises.exercises = userExercises.exercises.slice(0, limit)

  // Response
  return res.json({
    username: userExercises.username,
    count: userExercises.exercises.length,
    _id: req.params._id,
    log: userExercises.exercises
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
