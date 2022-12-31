const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const app = express()
const cors = require('cors')
const htmlPath = __dirname + '/views/index.html'

require('dotenv').config()

mongoose.set('strictQuery', false);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect(process.env.MONGO_URI).then(
  () => {return console.log('Connected to MongoDB')},
  err => {return console.error(err)}
);

const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  }
})

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
log: [exerciseSchema]
}, {versionKey: false});

const User = mongoose.model('Users', userSchema);

app.get('/', (req, res) => {
  res.sendFile(htmlPath)
});

app.post('/api/users', function(req, res) {
  debugger;
  let username = req.body.username;
  User.findOne({username}, (err, match) => {
    if(match) {
      let {_id} = match;
      return res.json({
        username,
        _id
      });
    }
    User.create({username}, (err, newUser) => {
    let {_id} = newUser;
      return res.json({
        username,
        _id
      });
    })
  })
});

app.get('/api/users', function(req, res) {
  User.find({}, (err, users) => {
    const filteredUsers = users.map((value) => {
      let {username, _id} = value
      return {
        username,
        _id
      };
    });
    res.json(filteredUsers);
  })
});

app.post('/api/users/:_id/exercises', (req, res) => {
  User.findById(req.params._id, (err, match) => {
    let date = req.body.date;
    let {description, duration} = req.body;

    if (date == '') {
      date = new Date().toDateString();
    } else {
      date = new Date(date).toDateString();
      if(date === "Invalid Date") {
        date = new Date().toDateString();
      }
    }
    match.log.push({description, duration, date});
    match.save((err, user) => {
      let {username, _id} = user;
      res.json({
        username,
        description,
        duration: parseInt(duration),
        date,
        _id
      });
    });
  })
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  console.log(req.query)
  console.log(req.url)

  User.findById(req.params._id, (err, match) => {
    debugger;
    let log = [];
    let loopLimit = limit === undefined ? match.log.length : limit;
    for(let i = 0; i < loopLimit; i++ ) {
      let doNotPush = false; 
      let value = match.log[i];
      let index = i;

      let {description, duration, date} = value;
      
      if(JSON.stringify(req.query) !== '{}') {
        console.log('We use the params here')
        let dateDate = new Date(date);
        let fromDate = new Date(from);
        let toDate = new Date(to);

        if(from !== undefined) {
          console.log("The value of fromDate is: " + fromDate)
          console.log(typeof fromDate)
          console.log("The value of dateDate is: " + dateDate)
          //we do not include before from date
          if(fromDate > dateDate) doNotPush = true;
        }

        if(to !== undefined) {
          console.log("The value of toDate is: " + toDate)
          console.log("The value of dateDate is: " + dateDate)
          //we do not include after to date
          if(toDate < dateDate) doNotPush = true;
        }
      }

      if(!doNotPush) {
        log.push({
          description,
          duration,
          date
        });
      }
    }
    
    let {username, _id} = match;
    console.log({
      username,
      count: log.length,
      _id,
      log
    })

    res.json({
      username,
      count: log.length,
      _id,
      log
    });
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})