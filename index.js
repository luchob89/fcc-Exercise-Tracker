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

    const newUser = new User({
      username: req.body.username
    });
  
    const result = await newUser.save();
    
    //console.log('POST Create user result: ', result)

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

  // Db query
  const queryResult = await User.find({}, 'username _id').exec();

  //console.log('GET All Users: ', queryResult)

  return res.json(queryResult)

})

// Users POST create new exercise for 1 user
app.post('/api/users/:_id/exercises', async (req, res) => {

  // ELLOS MANDAN 11 INTENTOS
  // YO CREO 10 EJERCICIOS
  //console.log('INTENTO DE CREACION DE NUEVO EJERCICIO')

  // console.log('POST exercise')
  // console.log('req.body: ', req.body)
  // console.log('req.params: ', req.params)
  // console.log('req.query: ', req.query)

  let date = new Date().toDateString();

  // Had to add 1 day extra because of timezone difference
  if ( req.body.date ) {
    let dateFix = new Date(req.body.date);
    let plusOneDay = dateFix.setDate(dateFix.getDate() + 1);
    date = new Date(plusOneDay).toDateString();
  }

  const newSolution = await User.findByIdAndUpdate(req.params._id, {
    $push: { 
      exercises: {
        description: req.body.description,
        duration: req.body.duration,
        date: date
      }
    }
  })

  console.log('New solution: ', newSolution)

  // const updateUser = await User.updateOne({ _id: req.params._id }, {
  //   description: req.body.description,
  //   duration: req.body.duration,
  //   date: date
  // })

  //console.log('New exercise result: ', updateUser)

  // Db query
  //const queryResult = await User.findById(req.params._id, 'username description duration date _id').exec();

  //console.log('Response: ', queryResult)

  return res.json({
    username: newSolution.username,
    description: req.body.description,
    duration: req.body.duration,
    date: date,
    _id: req.params._id
  })

})

// GET all exercises from specific user
app.get('/api/users/:_id/logs', async (req, res) => {

  // Db query
  const userExercises = await User.findById(req.params._id).exec();

  console.log('userExercises: ', userExercises)

  const { to, from, limit} = req.query;

  if ( from ) userExercises.exercises.filter( exercise => exercise.date > new Date(from).toDateString() )
  if ( to ) userExercises.exercises.filter( exercise => exercise.date < new Date(to).toDateString() )
  if ( limit ) userExercises.exercises.slice(0, limit)

  // Response
  return res.json({
    username: userExercises.username,
    count: userExercises.exercises.length,
    _id: req.params._id,
    log: userExercises.exercises
  })

  // // Loop over results to fill response object properly
  // for ( let i = 0; i < queryResult.length; i++ ) {

  //   responseObject.username = queryResult[i].username

  //   const { to, from, limit} = req.query;

  //   if ( from || to || limit ) {

  //     //console.log('from: ', from)
  //     //console.log('to: ', to)
  //     //console.log('limit: ', limit)

  //     //console.log(req)

  //     if ( queryResult[i].date < new Date(from).toDateString() ) continue; // from=1989-12-31
  //     if ( queryResult[i].date > new Date(to).toDateString() ) continue; // to=1990-01-04
  //     if ( limit !== undefined && i > limit ) break;
  //   }

  //   responseObject.log.push({
  //     description: queryResult[i].description,
  //     duration: queryResult[i].duration,
  //     date: queryResult[i].date,
  //   })
  // }

  // // /api/users/675889ccbcc861589f84fd58/logs?from=1928-05-05&to=2050-05-05&limit=5
  // // ESTO MANDA FCC: SIN LIMIT
  // // /api/users/6759e326ac394723fa4164d9/logs?from=1989-12-31&to=1990-01-04

  // responseObject.count = responseObject.log.length;

  // console.log('Response: ', responseObject)

  // // Response
  // return res.json(responseObject)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
