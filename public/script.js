var Game = function(nb_players) {
  /*
    Private :
  */

  var self = this;

  // Context
	var context_player = $("#canvas_player").get(0).getContext("2d");
	var context_background = $("#canvas_background").get(0).getContext("2d");

	// Different type of cell
	var cell_herb = 0;
	var cell_box = 1;
	var cell_wall = 2;

	// Images
	var image_size = 16;
	var image_map = {};
	image_map[cell_herb] = image_size*2;	// herb
	image_map[cell_box] = image_size;			// box
	image_map[cell_wall] = 0; 						// wall
	var image_players = {
												1:	image_size,		// player1
												2:	image_size*2,	// player2
												3:	image_size*3,	// player3
												4:	image_size*4	// player4
											};
	var image_bomb = image_size*4;

	// Image sprite
	var image = new Image();



  // Intitialization function
	var map, players, bombs, nb_row_column, num_player, context_width_height;
	this.init = function(data) {
		// array of cell
		map = data.map;
		// array of players with their coord and if they can put a bomb
		players = data.players,
		// array of bombs with their coord and remaining time
		bombs = data.bombs,
		// size of the map
		nb_row_column = data.nb_row_column,
		// current player number
		num_player = data.num_player;

		// size of the map with the size of image
		context_width_height = (nb_row_column+2) * image_size;

		// Set size canvas
		$("#canvas_player").attr({width: context_width_height, height: context_width_height});
		$("#canvas_background").attr({width: context_width_height, height: context_width_height});

		// Load the game
		image.src = "/img/bomb_party.png";
		$(image).load(function() {
		  // loop bombs
		  bombs.forEach(function(val, index) {
        // program explosion
        timeoutBomb(index-1, val);
		  });

		  // refresh
	  	animateMap();
		  animatePlayer();
		});
	};

  // check that the coordinates is in the map
	var checkPosition = function(x, y) {
		return 0 < x && 0 < y && x <= nb_row_column && y <= nb_row_column;
	};

  // program setTimeout function to explode the bomb
	var timeoutBomb = function(index, bomb) {
	  setTimeout(function() {
      // remove bomb from array
		  bombs.slice(index, 1);

		  // destroy boxes and kill players in area
		  explosion(bomb[0], bomb[1]);

		  // refresh
      animatePlayer();
		}, bomb[2] * 1000);

		if (bomb[2] >= 2) {
		  setTimeout(function() {
		    // edit the remaining time
  		  bomb[2] = 1;

  		  // refresh
		    animatePlayer();
		  }, (bomb[2]-1) * 1000);
		}

		if (bomb[2] == 3) {
		  setTimeout(function() {
		    // edit the remaining time
  		  bomb[2] = 2;

  		  // refresh
		    animatePlayer();
		  }, 1000);
		}
	};

  // function to destroy boxes and kill players after explosion of a bomb
  var explosion = function(x, y) {
    // check all possible cells where it can explode
    [[x,y], [x-1,y], [x+1,y], [x,y-1], [x,y+1]].forEach(function(coord) {
      // game end or outside the map
      if (self.isEnd() || !checkPosition(coord[0], coord[1]) || map[coord[1]][coord[0]] == cell_wall)
        return;

      // can contain players
      if (map[coord[1]][coord[0]] == cell_herb) {
        // loop players
        for (var index in players) {
          // prevent of kill all players to know who is the winner
          if (self.isEnd())
            return;
          // player in the cell
          else if (coord[0] == players[index][0] && coord[1] == players[index][1]) {
            // remove player from the array
            delete players[index];
          }
        }
      } else {
        // the cell contained a box
        map[coord[1]][coord[0]] = cell_herb;
      }
    });

    // refresh
    animateMap();
    animatePlayer();
  };

  // function to move the player (true if accepted)
  var movePlayer = function(direction) {
    // player don't exist (dead) or game end
    if (players[num_player] == undefined || self.isEnd())
      return false;

    // coord player
    var x = players[num_player][0],
        y = players[num_player][1];
    var coord = {"UP":[x,y-1], "DOWN":[x,y+1], "LEFT":[x-1,y], "RIGHT":[x+1,y]};

    // check direction and new coord contain herb
    if (coord[direction] != undefined && map[coord[direction][1]][coord[direction][0]] == cell_herb) {
      // edit the coord
  		players[num_player][0] = coord[direction][0];
  		players[num_player][1] = coord[direction][1];

      // refresh
      animatePlayer();

  		return true;
    } else
    return false;
  };

  // function to place a bomb (true if accepted)
  var placeBomb = function() {
    // player exist, has a bomb in stock and game not end
    if (players[num_player] != undefined && players[num_player][2] && !self.isEnd()) {
      // use this bomb in stock
      players[num_player][2] = false;

      // add the bomb
		  bombs.push([players[num_player][0], players[num_player][1], 3]);

		  // refresh
	    animatePlayer();

		  // index of the last bomb inserted
		  var index = bombs.length - 1;

		  // in 3s explosion of the bomb
		  timeoutBomb(index, bombs[index]);

		  setTimeout(function() {
			  // new bomb in stock
	      players[num_player][2] = true;
		  }, 3000);

  		// refresh
  		animatePlayer();

      return true;
    } else
      return false;
  };

	// show the map
	var animateMap = function() {
		// clear canvas
		context_background.clearRect(0, 0, context_width_height, context_width_height);

    /*
      draw the contour with walls
      draw herbs, boxes, walls if it's the good type of cell
    */

		for (var i = 0; i < nb_row_column+2; i++)
			context_background.drawImage(image, image_map[2], 0, image_size, image_size, i * image_size, 0, image_size, image_size);

		for (var j = 1; j <= nb_row_column; j++) {
			var  size_j = j * image_size;

			context_background.drawImage(image, image_map[2], 0, image_size, image_size, 0, size_j, image_size, image_size);

			for (var i = 1; i <= nb_row_column; i++)
				context_background.drawImage(image, image_map[map[j][i]], 0, image_size, image_size, i * image_size, size_j, image_size, image_size);

			context_background.drawImage(image, image_map[2], 0, image_size, image_size, (nb_row_column+1) * image_size, size_j, image_size, image_size);
		}

		for (var i = 0; i < nb_row_column+2; i++)
			context_background.drawImage(image, image_map[2], 0, image_size, image_size, i * image_size, context_width_height - image_size, image_size, image_size);
	};

	// show players and bombs
	var animatePlayer = function() {
		// clear canvas
		context_player.clearRect(0, 0, context_width_height, context_width_height);

		// show bombs with their proper wick
		$.each(bombs, function(key, value) {
			context_player.drawImage(image, image_bomb*(4-value[2]), 0, image_size, image_size, value[0]*image_size, value[1]*image_size, image_size, image_size);
		});

		// show players
		$.each(players, function(key, value) {
			context_player.drawImage(image, 0, image_players[key], image_size, image_size, value[0]*image_size, value[1]*image_size, image_size, image_size);
		});
	};

  /*
    Public :
  */

  // function to export the game
  this.export = function() {
    return {'map' : map, 'players' : players, 'bombs' : bombs, 'nb_row_column' : nb_row_column};
  };

  // function to know if the game is finished
  this.isEnd = function() {
    return nb_players == 1;
  };

  // function to move one player
	this.move = function(data) {
		// edit the coord
		players[data.player][0] = data.x;
		players[data.player][1] = data.y;

		// refresh the canvas
		animatePlayer();
	};

	// function to put a bomb
	this.bomb = function(data) {
		// add the bomb
		bombs.push([data.x, data.y, 3]);

		// index of the last bomb inserted
	  var index = bombs.length - 1;

	  // in 3s explosion of the bomb
	  timeoutBomb(index, bombs[index]);

		// refresh the canvas
		animatePlayer();
	};

	// detect player actions
	this.eventKey = function(event, socket) {
		// player is dead
		if (!num_player) return;

		// recovery the key depending on the browser
		var e = event || window.event;
		var key = e.which || e.keyCode;

    // direction to move
		var direction;

		switch(key) {
			/* UP, Z, W */
			case 38:
			case 90:
			case 87:
							direction = "UP";
							break;
			/* RIGHT, D */
			case 39:
			case 68:
							direction = "RIGHT";
							break;
			/* DOWN, S */
			case 40:
			case 83:
							direction = "DOWN";
							break;
			/* LEFT, Q, A */
			case 37:
			case 81:
			case 65:
							direction = "LEFT";
							break;
			/* SPACE, ENTER */
			case 32:
			case 13:
						// pomb placed
						if (placeBomb()) {
							socket.emit('bomb');

							return;
						}
						break;
			default:
						return;
						//break;
		}

		// movement
		if (movePlayer(direction)) {
			socket.emit('move', direction);
		}
	};
};

$(function() {
	// if we are on the page of match
	if ($("#page_match").length) {
		// connection to server
    var socket = io.connect();

    // game object
    var partie = new Game();

    // request a game
    socket.emit('game');

		// load the game
    socket.on('start', partie.init);

    // a player was moved
    socket.on('move', partie.move);

    // a bomb was posed
    socket.on('bomb', partie.bomb);


    // event to catch actions on the keyboard
    $(document).keydown(function(event) {
    	partie.eventKey(event, socket);
    });
	}
});