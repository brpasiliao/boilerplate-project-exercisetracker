const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

const { Schema } = mongoose;

const Exercise = mongoose.model('Exercise', new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
}));

const User = mongoose.model('User', new Schema({
  username: String,
}));

const Log = mongoose.model('Log', new Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String,
  }]
}));

Exercise.deleteMany({}, (err) =>  {
  if (err) console.log(err)
});
User.deleteMany({}, (err) =>  {
  if (err) console.log(err)
});
Log.deleteMany({}, (err) =>  {
  if (err) console.log(err)
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users')
.get((req, res) => {
  User.find({}, (err, users) => {
    if (err) console.log(err);
    else res.json(users);
  });
})
.post((req, res) => {
  const newUser = new User({
    username: req.body.username, 
  });
  newUser.save();

  const newLog = new Log({
    username: newUser.username,
    count: 0,
  })
  newLog.save();

  res.send({ 
    username: newUser.username,
    _id: newUser._id 
  })
});

app.post('/api/users/:_id/exercises', (req, res) => {
  User.findById(req.params._id, (err, user) => {
    if (err) console.error(err);
    else {
      let date = new Date();
      if (req.body.date != "") date = req.body.date;

      const newExercise = new Exercise({
        username: user.username,
        description: req.body.description,
        duration: req.body.duration,
        date: date.toDateString(),
      });
      newExercise.save();

      // const userLog = Log.findOne({username: user.username});
      // userLog.count = userLog.count + 1;
      // userLog.log.push({
      //   description: newExercise.description,
      //   duration: newExercise.duration,
      //   date: newExercise.date
      // });
      // userLog.save();
      Log.findOneAndUpdate(
        { username: user.username }, 
        {
          // $inc: {count: 1},
          count: 100,
          $push: {
            "log": {
              description: newExercise.description,
              duration: newExercise.duration,
              date: newExercise.date
            }
          }
        },
        { new: true }
      );

      res.send({
        _id: user._id,
        username: user.username,
        date: newExercise.date,
        duration: newExercise.duration,
        description: newExercise.description
      });
    }
  });
});

app.route('/api/users/:_id/logs')
.get((req, res) => {
  // User.findById(req.params._id, (err, user) => {
  //   if (err) console.error(err);
  //   else {
  //     Log.findOne({username: user.username}, (err, log) => {
  //       if (err) console.error(err);
  //       else {
  //         res.send(log);
  //       }
  //     })
  //   }
  // })

  Log.find({}, (err, logs) => {
    if (err) console.log(err);
    else res.json(logs);
  });
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
