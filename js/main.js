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

	function makeGridArray(data, size) {
		var grid = range(0,size).map(function(c) { return range(0,size).map(function(b) { return {submission_value: null, count: 0, ids: []} }) }),
				userValueToGridIdx = new Scale(data.extents[0], data.extents[1], 0, size - 1),
				grid_xy,
				max = 0,
				cell;

		for (var i = 0; i < data.submissions.length; i++){
			grid_xy = [Math.round(userValueToGridIdx(data.submissions[i].x_sentiment)), Math.round(userValueToGridIdx(data.submissions[i].y_sentiment))] 

			cell = grid[grid_xy[1]][grid_xy[0]];
			cell.count++;
			cell.submission_value = data.submissions[i].x_sentiment + ', ' + data.submissions[i].y_sentiment; // For sanity check, can be removed
			cell.ids.push(data.submissions[i].uid); 
			if (cell.count > max) max = cell.count;
		}
		return {grid: grid, extents: [0, max]}
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

	function setSquareFill(extents, val){
		val = Number(val);
		var colorScale = new Scale(extents[0], extents[1], 0, 4) // Use a five color scale for now.
		return 'q' + Math.round(colorScale(val)) + '-5';

	}

	function gridArrayToMarkup($grid, Grid, color_brewer_style_name){
		$grid.hide()
				 .addClass(color_brewer_style_name)
				 .addClass('st-grid')
				 .html('');
		var grid = Grid.grid,
				extents = Grid.extents,
				grid_width  = $grid.width(),
			  grid_height = $grid.height(),
			  square_value,
			  submission_value,
			  ids;

		// For every row in the grid, make a row element
		for (var i = 0; i < grid.length; i++ ){
			$('<div class="st-row"></div>').height(grid_height / grid.length)
																	.appendTo($grid);

			// Now make a cell with the aggregate data
			for (var j = 0; j < grid.length; j++){
				square_value = grid[i][j].count;
				submission_value = grid[i][j].submission_value;
				ids   = grid[i][j].ids.toString()
				$('<div class="st-cell"></div>').width(grid_width / grid.length)
																			 .attr('data-submission-value', submission_value)
																			 .attr('data-ids', ids)
																			 .html(square_value)
																			 .addClass(setSquareFill(extents, square_value))
																			 .appendTo($($grid.find('.st-row')[i]));
			}
		}
		$grid.show();

	}

	function submissionsToMarkup(subm_data, conf){
		var Grid = makeGridArray(subm_data, conf.grid_size);
		gridArrayToMarkup(conf.$grid, Grid, conf.color_brewer_style_name);

	}

	function bindHandlers(){
		$('.st-grid').on('mouseover', '.st-cell', function(){
			var $this = $(this);
			console.log('Input submission: ', $this.attr('data-submission-value'))
		});

		$('.st-grid').on('mouseleave', function(){
			/* HIDE TOOLTIP */
		});

		$('.st-grid').on('click', '.st-cell', function(){
			var $this = $(this);
			var submission_value = $this.attr('data-submission-value');

			console.log(submission_value);
			/* PROMPT FROM SUBMISSION */
		});
	}

	function formSubmit(){
		submissionsToMarkup(subm_data, grid_size, $grid);
	}

	/* CONFIG THINGS */
	var CONFIG = {
		"$grid": $('#grid'),
		"grid_size": 11,
		"input_range": 5,
		"color_brewer_style_name": 'YlGnBu'
	}

	var submission_data = generateRandomData(2500, CONFIG.input_range);
	/* end config things */

	submissionsToMarkup(submission_data, CONFIG);
	bindHandlers();

}).call(this);