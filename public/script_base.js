// the class of the game
var Game = function () {
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
		// array of bombs with their coord
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
	  	animate();
		});
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
		bombs.push([data.x, data.y]);

		// in 3s explosion of the bomb
		setTimeout(function() {
			players[num_player][2] += 1;
			exploseBomb(data.x, data.y);
		}, 3000);

		// refresh the canvas
		animatePlayer();
	};

	// checks that the coordinates are attainable
	var checkPosition = function(x, y) {
		// outside the map
		if (x < 0 || y < 0 || nb_row_column < x || nb_row_column < y)
			return false;

		// cell contain herb
		return map[y][x] == cell_herb;
	};

	// animate canvas element
	var animate = function() {
		// clear canvas
		context_player.clearRect(0, 0, context_width_height, context_width_height);

		// update the game
		animateMap();
		animatePlayer();
	};

	// show the map
	var animateMap = function() {
		// clear canvas
		context_background.clearRect(0, 0, context_width_height, context_width_height);

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

		// show bombs
		$.each(bombs, function(key, value) {
			context_player.drawImage(image, image_bomb, 0, image_size, image_size, value[0]*image_size, value[1]*image_size, image_size, image_size);
		});

		// show players
		$.each(players, function(key, value) {
			context_player.drawImage(image, 0, image_players[key], image_size, image_size, value[0]*image_size, value[1]*image_size, image_size, image_size);
		});
	};

	// explosion of player and box near the bomb
	var exploseBomb = function(x, y) {
		// remove bomb from list of bombs
		bombs.splice(bombs.indexOf([x,y]), 1);

		// remove the box and stop when we find a wall
		for(var i = x; x-2 <= i; i--) {
			if (i < 0 || nb_row_column < i || map[y][i] == cell_wall)
				break;
			else
				map[y][i] = cell_herb;
		}
		for(var i = x; i <= x+2; i++) {
			if (i < 0 || nb_row_column < i || map[y][i] == cell_wall)
				break;
			else
				map[y][i] = cell_herb;
		}
		for(var j = y; y-2 <= j; j--) {
			if (j < 0 || nb_row_column < j || map[j][x] == cell_wall)
				break;
			else
				map[j][x] = cell_herb;
		}
		for(var j = y; j <= y+2; j++) {
			if (j < 0 || nb_row_column < j || map[j][x] == cell_wall)
				break;
			else
				map[j][x] = cell_herb;
		}

		// refresh canvas
		animate();
	};

	// detect player actions
	this.eventKey = function(event, socket) {
		// player is dead
		if (!num_player) return;

		// recovery the key depending on the browser
		var e = event || window.event;
		var key = e.which || e.keyCode;

		// players informations
		var x = players[num_player][0];
		var y = players[num_player][1];
		var b = players[num_player][2];

		switch(key) {
			/* UP, Z, W */
			case 38:
			case 90:
			case 87:
							y -= 1;
							break;
			/* RIGHT, D */
			case 39:
			case 68:
							x += 1;
							break;
			/* DOWN, S */
			case 40:
			case 83:
							y += 1;
							break;
			/* LEFT, Q, A */
			case 37:
			case 81:
			case 65:
							x -= 1;
							break;
			/* SPACE, ENTER */
			case 32:
			case 13:
						// has bomb in stock
						if (b > 0) {
							// socket to put a bomb
							socket.emit('bomb', {'x' : x, 'y' : y});
							// put the bomb
							self.bomb({'x' : x, 'y' : y});
							// update information
							players[num_player][2] = b-1;

							return;
						}
						break;
			default:
						return;
						break;
		}

		// attainable position
		if (checkPosition(x, y)) {
			// socket to movements
			socket.emit('move', {'x' : x, 'y' : y});
			// move the player
			self.move({'player' : num_player, 'x' : x, 'y' : y});
			// update coord
			players[num_player][0] = x;
			players[num_player][1] = y;
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

