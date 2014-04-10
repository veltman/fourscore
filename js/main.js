(function(){
	'use-strict'
/********************************/

	function range(start, stop, step) {
	  if (arguments.length < 3) {
	    step = 1;
	    if (arguments.length < 2) {
	      stop = start;
	      start = 0;
	    }
	  }
	  if ((stop - start) / step === Infinity) throw new Error("infinite range");
	  var range = [],
	       k = range_integerScale(Math.abs(step)),
	       i = -1,
	       j;
	  start *= k, stop *= k, step *= k;
	  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k);
	  else while ((j = start + step * ++i) < stop) range.push(j / k);
	  return range;
	};

	function range_integerScale(x) {
	  var k = 1;
	  while (x * k % 1) k *= 10;
	  return k;
	}	
/********************************/

	function makeGrid(data, size) {
		var grid = range(0,size).map(function(c) { return range(0,size).map(function(b) { return {coords: null, count: 0, ids: []} }) }),
				userValueToGridIdx = new Scale(data.extents[0], data.extents[1], 0, size - 1),
				grid_xy,
				max = 0,
				cell;

		for (var i = 0; i < data.submissions.length; i++){
			grid_xy = [Math.round(userValueToGridIdx(data.submissions[i].x_sentiment)), Math.round(userValueToGridIdx(data.submissions[i].y_sentiment))] 

			cell = grid[grid_xy[1]][grid_xy[0]];
			cell.count++;
			cell.coords = data.submissions[i].x_sentiment + ', ' + data.submissions[i].y_sentiment; // For sanity check, can be removed
			cell.ids.push(data.submissions[i].uid); 
			if (cell.count > max) max = cell.count;
		}
		return {grid: grid, extents: [0, max]}
	}

	function generateRandomData(numb_submissions, range){
		var data = {},
				obj;
		data.extents = [range * -1, range];
		data.submissions = [];
		for (var i = 0; i < numb_submissions; i++){
			obj = {};
			obj.uid = 'id-' + i
			obj.comment = 'Submission text ' + i;
			obj.x_sentiment = Math.round(Math.random() * range) * ((i % 2 == 0) ? -1 : 1);
			obj.y_sentiment = Math.round(Math.random() * range) * ((i % 3 != 0) ? -1 : 1);
			data.submissions.push(obj);
		}
		return data;
	}

	function findGridExtents(grid){
		var min,
				max;
		min = max = grid[0][0];
		for (var i = 0; i < grid.length; i++){
			for (var j = 0; j < grid.length; j++){
				if (grid[i][j] > max) max = grid[i][j]
				if (grid[i][j] <= min) min = grid[i][j]
			}
		}
		return [min, max]
	}


	// function reduceGrid(grid, factor_of) {
	// 	var size = grid.length,
	// 			factor_of = factor_of || 2;

	// 	if (0 !== size % 2 ) {
	// 		throw new Error('wrong');
	// 	}

	// 	var new_grid = [],
	// 	    new_extents;

	// 	for (var i = 0; i < size; i++) {
	// 		var ii = Math.floor(i/factor_of);
	// 		if (!new_grid[ii]) { new_grid[ii] = [] };
	// 		for (var j = 0; j < size; j++) {
	// 			var jj = Math.floor(j/factor_of);
	// 			new_grid[ii][jj] = new_grid[ii][jj] ? new_grid[ii][jj] + grid[i][j] : grid[i][j];
	// 		}
	// 	}

	// 	new_extents = findGridExtents(new_grid);
	// 	return {grid: new_grid, extents: new_extents};
	// }

	function setSquareFill(extents, val){
		val = Number(val);
		var colorScale = new Scale(extents[0], extents[1], 0, 4) // Use a five color scale for now.
		return 'q' + Math.round(colorScale(val)) + '-5';

	}

	function gridToMarkup($grid, Grid){
		$grid.hide().addClass(color_brewer_style_name);
		var grid = Grid.grid,
				extents = Grid.extents,
				grid_width  = $grid.width(),
			  grid_height = $grid.height(),
			  square_value,
			  coords,
			  ids;

		// For every row in the grid, make a row element
		for (var i = 0; i < grid.length; i++ ){
			$('<div class="row"></div>').height(grid_height / grid.length)
																	.appendTo($grid);

			for (var j = 0; j < grid.length; j++){
				square_value = grid[i][j].count;
				coords = grid[i][j].coords;
				ids   = grid[i][j].ids.toString()
				$('<div class="square"></div>').width(grid_width / grid.length)
																			 .attr('data-coords', coords)
																			 .attr('data-ids', ids)
																			 .html(square_value)
																			 .addClass(setSquareFill(extents, square_value))
																			 .appendTo($($grid.find('.row')[i]));
			}
		}
		$grid.show();

	}

	var $grid  = $('#grid'),
			grid_size   = 11,
			input_range = 5,
			subm_data = generateRandomData(2500, input_range),
			Grid   = makeGrid(subm_data, grid_size),
			color_brewer_style_name = 'YlGnBu';

	gridToMarkup($grid, Grid);

}).call(this);