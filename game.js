module.exports = function(nb_players) {
  /*
    Private :
  */

  var self = this;

  // size of the map
  var nb_row_column = 11;

  // array of cell
  var map = [
  						[2,2,2,2,2,2,2,2,2,2,2,2,2],
  						[2,0,0,1,1,1,1,1,1,1,0,0,2],
  						[2,0,2,1,2,1,2,1,2,1,2,0,2],
  						[2,1,1,1,1,1,1,1,1,1,1,1,2],
  						[2,1,2,1,2,1,2,1,2,1,2,1,2],
  						[2,1,1,1,1,1,1,1,1,1,1,1,2],
  						[2,1,2,1,2,1,2,1,2,1,2,1,2],
  						[2,1,1,1,1,1,1,1,1,1,1,1,2],
  						[2,1,2,1,2,1,2,1,2,1,2,1,2],
  						[2,1,1,1,1,1,1,1,1,1,1,1,2],
  						[2,0,2,1,2,1,2,1,2,1,2,0,2],
  						[2,0,0,1,1,1,1,1,1,1,0,0,2],
  						[2,2,2,2,2,2,2,2,2,2,2,2,2]
  					];
	// Different type of cell
	var cell_herb = 0;
	var cell_box = 1;
	var cell_wall = 2;

  // array of players with their coord and if they can put a bomb
  var players = {1: [1, 1, true], 2: [nb_row_column, 1, true]};
  // check number of players
  if (nb_players > 2)
    players[3] = [1 ,nb_row_column, true];
  if (nb_players > 3)
    players[4] = [nb_row_column, nb_row_column, true];

  // array of bombs with their coord and remaining time
  var bombs = [];


  // check that the coordinates is in the map
	var checkPosition = function(x, y) {
		return 0 < x && 0 < y && x <= nb_row_column && y <= nb_row_column;
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

  // function to move a player (true if accepted)
  this.movePlayer = function(num, direction) {
    // player don't exist (dead) or game end
    if (players[num] == undefined || self.isEnd())
      return false;

    // coord player
    var x = players[num][0],
        y = players[num][1];
    var coord = {"UP":[x,y-1], "DOWN":[x,y+1], "LEFT":[x-1,y], "RIGHT":[x+1,y]};

    // check direction and new coord contain herb
    if (coord[direction] != undefined && map[coord[direction][1]][coord[direction][0]] == cell_herb) {
      // edit the coord
  		players[num][0] = coord[direction][0];
  		players[num][1] = coord[direction][1];

  		return true;
    } else
    return false;
  };

  // function to place a bomb (true if accepted)
  this.placeBomb = function(num) {
    // player exist, has a bomb in stock and game not end
    if (players[num] != undefined && players[num][2] && !self.isEnd()) {
      // use this bomb in stock
      players[num][2] = false;

      // add the bomb
		  bombs.push([players[num][0], players[num][1], 3]);

		  // index of the last bomb inserted
		  var index = bombs.length - 1;

		  // in 3s explosion of the bomb
  		setTimeout(function() {
  		  // edit the remaining time
  		  bombs[index][2] = 2;

  		  setTimeout(function() {
  		    // edit the remaining time
    		  bombs[index][2] = 1;

    		  setTimeout(function() {
    		    // new bomb in stock
            players[num][2] = true;

            // remove bomb from array
      		  bombs.slice(index, 1);

      		  // destroy boxes and kill players in area
      		  explosion(players[num][0], players[num][1]);
      		}, 1000);
    		}, 1000);
  		}, 1000);

      return true;
    } else
      return false;
  };

  return this;
};
