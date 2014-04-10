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
		// If they haven't specified a custom input range then make it a one-to-one based on grid size
		if (!range) range = Math.floor(CONFIG.grid_size/2);
		data.extents = [range * -1, range];
		data.submissions = [];
		for (var i = 0; i < numb_submissions; i++){
			obj = {};
			obj.uid = 'id-' + i
			obj.comment = 'Submission text ' + i;
			obj.x_sentiment = Math.ceil(Math.random() * range) * ((i % 2 == 0) ? -1 : 1);
			obj.y_sentiment = Math.ceil(Math.random() * range) * ((i % 3 != 0) ? -1 : 1);
			data.submissions.push(obj);
		}
		return data;
	}

	function makeGridArray(data, size) {
		var grid = range(0,size).map(function(c) { return range(0,size).map(function(b) { return {submission_value: null, count: 0, ids: []} }) }),
				userValueToGridIdx = new Scale(data.extents[0], data.extents[1], 0, size - 1),
				grid_x,
				grid_y,
				grid_xy,
				max = 0,
				cell;

		for (var i = 0; i < data.submissions.length; i++){
			grid_x = Math.round(userValueToGridIdx(data.submissions[i].x_sentiment));
			grid_y = Math.round(userValueToGridIdx(data.submissions[i].y_sentiment));

			grid_xy = [grid_x, grid_y];

			cell = grid[grid_xy[1]][grid_xy[0]];
			cell.count++;
			if (data.submissions[i].x_sentiment == 0) console.log(data.submissions[i].x_sentiment)
			cell.submission_value = data.submissions[i].x_sentiment + ', ' + data.submissions[i].y_sentiment; // For sanity check, can be removed
			cell.ids.push(data.submissions[i].uid); 
			if (cell.count > max) max = cell.count;
		}
		return {grid: grid, extents: [0, max]}
	}

	function setSquareFill(extents, val){
		val = Number(val);
		var colorScale = new Scale(extents[0], extents[1], 0, 4) // Use a five color scale for now.
		return 'q' + Math.round(colorScale(val)) + '-5';

	}

	function convertGridSelector(grid_selector){
		if (typeof grid_selector == 'string') return $(grid_selector);
		return grid_selector;
	}

	function gridArrayToMarkup(grid_selector, color_brewer_style_name, Grid){
		$grid = convertGridSelector(grid_selector);
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
		gridArrayToMarkup(conf.grid_selector, conf.color_brewer_style_name, Grid);

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
			var submission_values = $this.attr('data-submission-value').split(', ');
			var nv = {
				x_sentiment: submission_values[0],
				y_sentiment: submission_values[1]
			}

			console.log(submission_values);
			/* PROMPT FROM SUBMISSION */
			formSubmit(nv)
		});
	}

	function formSubmit(new_data){
		submission_data.submissions.push(new_data);
		submissionsToMarkup(submission_data, CONFIG);
	}

	/* CONFIG THINGS */
	var CONFIG = {
		"grid_selector": '#grid',
		"grid_size": 10,
		"color_brewer_style_name": 'YlGnBu'
	}

	var submission_data = generateRandomData(2500);
	/* end config things */

	submissionsToMarkup(submission_data, CONFIG);
	bindHandlers();

}).call(this);