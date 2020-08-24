var express = require('express');
var crypto = require('crypto');
var validator = require('validator');



// Run the application
var app = express();
// (process.env.PORT est un paramètre fourni par Cloud9)
var server = app.listen(process.env.PORT);
//var server = app.listen(8081);

// Sessions
var session = require('express-session')({ secret: 'o75YjBdA08s7pFh1xkIg', resave: false, saveUninitialized: false });

// Configuration des middlewares
app.use(require('body-parser').urlencoded({ extended: false }))
   .use(require('cookie-parser')())
   .use(session)
   .use(require('x-frame-options')());

// All files in public are viewable
app.use(express.static(__dirname + '/public'));

// Directory of render (twig files)
app.set('views', 'templates');


// Connexion à la base de données
var db    = require('mysql').createConnection({

  host     : process.env.IP,  // pas touche à ça : spécifique pour C9 !
  user     : process.env.C9_USER.substr(0,16),  // laissez comme ça, ou mettez
                                                // votre login à la place
  password : '',
  database : 'bomberman'  // mettez ici le nom de la base de données
});



/* Globals variables */

// user connected
var users_connected = {};
// for each player his oppenents in current game
var battleground = {};
// players waiting a game
var waiting_players = [];
// contains score of last game
var last_games = [];



/* Routes */

app.get('/', function(req, res) {
  // user is connected
  if (req.session.user) {
    return res.render('index.twig', { 'page' : 'home', 'matches' : last_games, 'csrf_logout' : req.session.csrf_logout });
  } else {
    return res.redirect('/signin');
  }
});

/* Connection */
app.get('/signin', function(req, res) {
  // user is connected
  if (req.session.user)
    return res.redirect('/');
  else {
    // csrf token
    req.session.csrf_token = req.session.csrf_token || crypto.randomBytes(8).toString('hex');

    return res.render('index.twig', { 'page' : 'signin', 'csrf_token' : req.session.csrf_token });
  }
});
app.post('/signin', function(req, res) {
  // user is connected
  if (req.session.user)
    return res.redirect('/');

  var data = { 'page' : 'signin', 'csrf_token' : req.session.csrf_token };

  // check all input required and csrf token
  if (req.body.login != undefined && req.body.password != undefined
      && req.body.csrf_token != undefined && req.body.csrf_token == req.session.csrf_token) {
    data['error'] = 'Login ou mot de passe incorrects';

    data['form_login'] = req.body.login.trim();

    // min length login is 3
    if (data['form_login'].length >= 3) {
      // SQL query selection
      return db.query('SELECT * FROM users WHERE login = ?', [data['form_login']], function(err, rows) {
        if (err) {
          console.log(err);
        } // check password is good
        else if (rows[0] != undefined && crypto.createHmac('SHA1', rows[0].salt).update(req.body.password).digest('hex') == rows[0].password) {
          req.session.user = rows[0];

          // csrf token for disconnection
          req.session.csrf_logout = crypto.randomBytes(8).toString('hex');

          // add user in the array of connected list
          users_connected[req.session.user.id] = req.session.user;

          delete req.session.csrf_token;
          return res.redirect('/');
        }

        return res.render('index.twig', data);
      });
    }
  } else {
    data['error'] = 'Veuillez remplir tous les champs';
  }
   
  return res.render('index.twig', data);
});

/* Inscription */
app.get('/signup', function(req, res) {
  // user is connected
  if (req.session.user)
    return res.redirect('/');
  else {
    // csrf token
    req.session.csrf_token = req.session.csrf_token || crypto.randomBytes(8).toString('hex');

    return res.render('index.twig', { 'page' : 'signup', 'csrf_token' : req.session.csrf_token });
  }
});
app.post('/signup', function(req, res) {
  // user is connected
  if (req.session.user)
    return res.redirect('/');

  var data = { 'page' : 'signup', 'csrf_token' : req.session.csrf_token };

  // check all input required and csrf token
  if (req.body.login != undefined && req.body.email != undefined && req.body.password != undefined && req.body.confirm_password != undefined
      && req.body.csrf_token != undefined && req.body.csrf_token == req.session.csrf_token) {
    data['form_login'] = req.body.login.trim();
    data['form_email'] = req.body.email.trim();

    // length login is between 3 and 20
    if (!validator.isLength(data['form_login'], { 'min' : 3, 'max' : 20}))
      data['error'] = 'Le login doit comporter entre 3 et 20 caractères';
    // valide email
    else if(!validator.isEmail(data['form_email']))
      data['error'] = 'L\'adresse e-mail doit être valide';
    // password and confirm_password must be equal
    else if(req.body.password != req.body.confirm_password)
      data['error'] = 'Les mots de passe doivent correspondre';
    // min length password is 6
    else if(req.body.password.length < 6)
      data['error'] = 'Le mot de passe doit faire au minimum 6 caractères';
    else {
      // create new random salt for must security
      var salt = crypto.randomBytes(8).toString('base64');
      // password will be hashed
      var password = crypto.createHmac('SHA1', salt).update(req.body.password).digest('hex');

      // SQL query inserting
      return db.query('INSERT INTO users(login, email, password, salt) VALUES(?, ?, ?, ?)', [data['form_login'], data['form_email'], password, salt], function(err, result) {
        // success
        if (result != undefined) {
          delete req.session.csrf_token;
          return res.redirect('/signin');
        }

        // problems with unique key
        if (err.code == 'ER_DUP_ENTRY') {
          // SQL query to check if it's login is duplicated
          return db.query('SELECT id FROM users WHERE login = ?', [data['form_login']], function(err2, rows) {
            if (err2) {
              console.log(err2);
            } else if (rows[0] != undefined) {
              data['error'] = 'Ce login existe déjà';
            } else {
              data['error'] = 'Cette adresse e-mail existe déjà';
            }

            return res.render('index.twig', data);
          });
        }
        // other error
        else {
          console.log(err);
          data['error'] = 'Une erreur est survenue';
        }

        return res.render('index.twig', data);
      });
    }
  } else {
    data['error'] = 'Veuillez remplir tous les champs';
  }

  return res.render('index.twig', data);
});

/* See or update profil member */
app.get('/profil', function(req, res) {
  // user is not connected
  if (!req.session.user)
    return res.redirect('/signin');
  else {
    // csrf token
    req.session.csrf_token = req.session.csrf_token || crypto.randomBytes(8).toString('hex');

    var data = { 'page' : 'profil', 'csrf_token' : req.session.csrf_token, 'csrf_logout' : req.session.csrf_logout };

    // all informations will be pass
    data['form_login'] = req.session.user.login;
    data['form_email'] = req.session.user.email;
    data['form_prenom'] = req.session.user.prenom;
    data['form_nom'] = req.session.user.nom;
    data['form_sex'] = req.session.user.sex;

    return res.render('index.twig', data);
  }
});
app.post('/profil', function(req, res) {
  // user is not connected
  if (!req.session.user)
    return res.redirect('/');

  var data = { 'page' : 'profil', 'csrf_token' : req.session.csrf_token, 'csrf_logout' : req.session.csrf_logout };

  // trim and default value for all fields
  data['form_login'] = req.session.user.login;
  data['form_email'] = req.body.email != undefined ? req.body.email.trim() : req.session.user.email;
  data['form_prenom'] = req.body.prenom != undefined ? req.body.prenom.trim() : req.session.user.prenom;
  data['form_nom'] = req.body.nom != undefined ? req.body.nom.trim() : req.session.user.nom;
  data['form_sex'] = req.body.sex != undefined ? req.body.sex : req.session.user.sex;

  // check input required and csrf token
  if (req.body.email != undefined && req.body.password != undefined
      && req.body.csrf_token != undefined && req.body.csrf_token == req.session.csrf_token) {
    // hash password
    var password = crypto.createHmac('SHA1', req.session.user.salt).update(req.body.password).digest('hex');

    // password for authentification
    if(password != req.session.user.password)
      data['error'] = 'Le mot de passe est incorrect';
    // email must be valide
    else if(!validator.isEmail(data['form_email']))
      data['error'] = 'L\'adresse e-mail doit être valide';
    // if change of password he must be more great than 6
    else if(req.body.new_password != undefined && req.body.new_password.length < 6)
      data['error'] = 'Le mot de passe doit faire au minimum 6 caractères';
    else {
      // hash password or replace by the same if no modification
      password = req.body.new_password != undefined ? crypto.createHmac('SHA1', req.session.user.salt).update(req.body.new_password).digest('hex') : password;

      // SQL query updating
      return db.query('UPDATE users SET email = ?, password = ?, prenom = ?, nom = ?, sex = ? WHERE id = ?', [data['form_email'], password, data['form_prenom'], data['form_nom'], data['form_sex'], req.session.user.id], function(err, result) {
        // success
        if (result != undefined) {
          data['success'] = 'La modification a bien été effectuée';

          // update session user with new change
          req.session.user.mail = data['form_email'];
          req.session.user.password = password;
          req.session.user.prenom = data['form_prenom'];
          req.session.user.nom = data['form_nom'];
          req.session.user.sex = data['form_sex'];

          // new csrf token
          req.session.csrf_token = crypto.randomBytes(8).toString('hex');
          data['csrf_token'] = req.session.csrf_token;
        }
        // duplicate entry for email
        else if (err.code == 'ER_DUP_ENTRY') {
          data['error'] = 'Cette adresse e-mail existe déjà';
        } else {
          console.log(err);
          data['error'] = 'Une erreur est survenue';
        }

        return res.render('index.twig', data);
      });
    }
  } else {
    data['error'] = 'Veuillez remplir tous les champs';
  }

  return res.render('index.twig', data);
});

/* Start the game vs someone */
app.get('/match', function(req, res) {
  // user is not connected
  if (!req.session.user)
    return res.redirect('/signin');

  return res.render('index.twig', { 'page' : 'match', 'csrf_logout' : req.session.csrf_logout });
});

/* Players rank and user connected */
app.get('/rank', function(req, res) {
  // SQL query selection and calcul points ordered
  return db.query('SELECT *, victories*3 - losses AS points  FROM users ORDER BY points DESC', function(err, rows) {
    if (err)
      console.log(err);

    return res.render('index.twig', { 'page' : 'rank', 'users' : rows, 'users_connected' : users_connected, 'csrf_logout' : req.session.csrf_logout });
  });
});

/* Sign out */
app.post('/logout', function(req, res) {
  // user is connected and csrf token is valide
  if (req.session.user && req.body.csrf_token != undefined && req.body.csrf_token == req.session.csrf_logout) {
    delete users_connected[req.session.user.id];
    req.session.destroy();
  }

  return res.redirect('/');
});

/* Default route */
app.use(function(req, res){
 return res.status(404).send('No route available');
});



// Socket
var io = require('socket.io').listen(server);
// Share session with io sockets
io.use(require('express-socket.io-session')(session));

// Load the class of the game
var Game = require('./game.js');


// Connection
io.sockets.on('connection', function (socket) {
  // user is not connected
  if (!socket.handshake.session.user)
    return;

  /* play at the game */
  socket.on('game', function() {
    // user is not connected
    if (!socket.handshake.session.user)
      return;

    // user id
    var session_user_id = socket.handshake.session.user.id;
    // player's number in the battle
  	var num_player;
  	// room socket
  	var id_room;
  	// current game
  	var game;

    // search opponent every second
    var searchPlayer = setInterval(function() {
      // player has a current game
      if (battleground[session_user_id]) {
        // get player's number
        num_player = battleground[session_user_id].players[0] == session_user_id ? 1 : 2;
        // id of room is the concat of the 2 players
        id_room = battleground[session_user_id].players.join('-');
        // get game object
        game = battleground[session_user_id].game;

        // join the room for the game
        socket.join(id_room);

        // export the game informations
        var data = game.export();
        data.num_player = num_player;

        // Send characteristics of map
        socket.emit('start', data);

        // stop search players
        clearInterval(searchPlayer);
      } else {
        // add user to waiting players if not present
        if (waiting_players.indexOf(session_user_id) == -1)
          waiting_players.push(session_user_id);

        // min 2 players are pending
        if (waiting_players.length >= 2) {
          var arr_players = [];

          // get the 2 first players in queue
          arr_players.push(waiting_players.shift());
          arr_players.push(waiting_players.shift());

          // create the game for the 2 players
          battleground[arr_players[0]] = { 'players' : arr_players, 'game' : Game(arr_players.length) };
          battleground[arr_players[1]] = battleground[arr_players[0]];
        }
      }
    }, 1000);

    // Event when a player is moving
    socket.on('move', function(direction) {
      // user is not connected
      if (!socket.handshake.session.user)
        return;

      if (!game.isEnd() && game.movePlayer(num_player, direction)) {
        // Emit the movement
        socket.broadcast.emit('movePlayer', {'player' : num_player, 'direction' : direction});
      }
    });

    // Event when a bomb is placed
    socket.on('bomb', function() {
      // user is not connected
      if (!socket.handshake.session.user)
        return;

      if (!game.isEnd() && game.putBomb(num_player)) {
        // Emit the placement
        socket.broadcast.emit('placeBomb', {'player' : num_player});
      }
    });
  });
});
