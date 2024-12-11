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
  description: String,
  duration: Number,
  date: String
});

const User = mongoose.model('User', userSchema);


// Create User POST endpoint
app.post('/api/users', async (req, res, next) => {

  try {

    const newUser = new User({
      username: req.body.username
    });
  
    const result = await newUser.save();
    
    console.log('POST Create user result: ', result)

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

  console.log('GET All Users: ', queryResult)

  return res.json(queryResult)

})

// Users POST create new exercise for 1 user
app.post('/api/users/:_id/exercises', async (req, res, next) => {

  const updateUser = await User.updateOne({ _id: req.params._id }, {
    description: req.body.description,
    duration: req.body.duration,
    date: !req.body.date? new Date().toDateString() : new Date(req.body.date).toDateString()
  })

  //console.log('New exercise result: ', updateUser)

  // Db query
  const queryResult = await User.findById(req.params._id, 'username description duration date _id').exec();

  //console.log('', queryResult)

  return res.json(queryResult)

})

// GET all exercises from specific user
app.get('/api/users/:_id/logs', async (req, res) => {

  let query;

  // Optional query parameters
  if ( req.query.from || req.query.to || req.query.limit ) {
    // Adding 'from' and 'to' to date parameter
    query = User.find({
      _id: req.params._id,
      date: { 
        $gt :  new Date(req.query.from).toDateString(), 
        $lt : new Date(req.query.to).toDateString()
      }
    })
    // Adding limit
    query.limit(req.query.limit)
  }
  else query = User.find({_id: req.params._id})


  // Db query
  const queryResult = await query.exec();

  console.log('GET All logs from User: ', queryResult)

  // Initial response object
  let responseObject = {
    username: queryResult[0].username,
    count: queryResult.length,
    _id: req.params._id,
    log: []
  }

  // Loop over results to fill response object properly
  for ( let i = 0; i < queryResult.length; i++ ) {
    responseObject.log.push({
      description: queryResult[i].description,
      duration: queryResult[i].duration,
      date: queryResult[i].date,
    })
  }

  // Response
  return res.json(responseObject)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
