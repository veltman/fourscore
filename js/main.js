(function(){
	'use-strict'

	var existing_data,
      $tooltip,
      $grid;

/********************************/

	function range(start, stop, step) {
	  if (arguments.length < 3) {
	    step = 1;
	    if (arguments.length < 2) {
	      stop = start;
	      start = 0;
	    }
	  }
	  if ((stop - start) / step === Infinity) throw new Error('infinite range');
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

  function findGridMax(submissions, scale){
    var max = 0,
        idx_max;
    for (var i = 0; i < submissions.length; i++){
      idx_max = Math.max(Math.round(scale(submissions[i].x)), Math.round(scale(submissions[i].y)));
      if (idx_max > max) max = idx_max;
    }
    return max + 1; // Add one because this returns the highest index, but we want to know the length
  }

	function makeGridArray(data, size) {
		var extent;
		// If they haven't specified a custom input range then make it a one-to-one based on grid size
    if (!data.inputExtents){
      extent = Math.floor(size/2);
      data.inputExtents = [extent * -1, extent];
    }
		var userValueToGridIdx = new Scale(data.inputExtents[0], data.inputExtents[1], 0, size - 1),
		    grid = range(0,size).map(function(c) { return range(0,size).map(function(b) { return {submission_value: [Math.round(userValueToGridIdx.inverse(b)),Math.round(userValueToGridIdx.inverse(c))], count: 0, ids: []} }) }),
				grid_x,
				grid_y,
				grid_xy,
				max = 0,
				cell;

    var grid_max = findGridMax(data.submissions, userValueToGridIdx);
    var possible_input_extent = Math.round((grid_max + 1) / 2);

		for (var i = 0; i < data.submissions.length; i++){
			grid_x = Math.round(userValueToGridIdx(data.submissions[i].x));
			grid_y = Math.round(userValueToGridIdx(data.submissions[i].y));
			grid_xy = [grid_x, grid_y];
      try {
  			cell = grid[grid_xy[1]][grid_xy[0]];
  			cell.count++;
  			cell.ids.push(data.submissions[i].uid); 
  			if (cell.count > max) max = cell.count;
      } catch(e){
        throw 'Input data outside of grid range. Please make your grid larger than ' + grid_max + ' or manually add inputExtents in your config file that cover the range of input values. Perhaps `inputExtents: [-'+possible_input_extent+','+possible_input_extent+'],` will work for you.';
      }
		}
		return {grid: grid, extents: [0, max]}
	}

	function convertNameToSelector(grid_selector){
		if (typeof grid_selector == 'string') {
			
			if (grid_selector.match(/#?[A-Za-z][A-Za-z0-9_-]+$/)) {
				return $('#' + grid_selector.replace(/^#/,''));
			}
			return $(grid_selector);
		}

		//ADD: if it's an element, return $(el);

		return grid_selector;
	}

  function colorScaleFactory($grid, color_info, extents){
    var color_brewer_name;
    var bins;
    var colorScale;
    var hex;
    var fn;

    // If it's an array then it's a custom list, if not, it's color brewer styles
    if (!_.isArray(color_info)){
      cb_name = color_info.name;
      bins = color_info.number;
      colorScale = new Scale(extents[0], extents[1], 0, bins - 1);
      fn = function(val){
        return colorbrewer[cb_name][bins][Math.round(colorScale(val))]
      }
    } else {
      colorScale = new Scale(extents[0], extents[1], 0, color_info.length - 1);
      fn = function(val){
        return color_info[Math.round(colorScale(val))]
      }
    }
    return fn
  }

	function gridArrayToMarkup(grid_selector, color_info, Grid){
    $grid = convertNameToSelector(grid_selector);
    var grid = Grid.grid,
        extents = Grid.extents,
        grid_width  = $grid.width(),
        grid_height = $grid.height(),
        square_value,
        submission_value,
        $cells,
        ids;

    $grid.find('.st-row').remove();

    $grid.hide()
         .addClass('st-grid');

    var colorScale = colorScaleFactory($grid, color_info, extents); // This will take a value and return a hex code

		// For every row in the grid, make a row element
		for (var i = 0; i < grid.length; i++ ){
			$('<div class="st-row"></div>').height(grid_height / grid.length - 1) // Subtract one for the margin on the bottom
																	   .appendTo($grid);

			// Now make a cell with the aggregate data
			for (var j = 0; j < grid.length; j++){
				square_value     = grid[i][j].count;
				submission_value = JSON.stringify(grid[i][j].submission_value);
				ids              = JSON.stringify(grid[i][j].ids);
        fill_color       = colorScale(square_value);

				$('<div class="st-cell"></div>').width(grid_width / grid.length - 1) // Subtract one for the margin on the right between cells
																			  .attr('data-submission-value', submission_value)
																			  .attr('data-ids', ids)
																			  .attr('data-cell-id', grid[i][j].submission_value[0] + '-' + grid[i][j].submission_value[1])
																			  // .html(square_value)
																			  .css('background-color', fill_color)
																			  .appendTo($($grid.find('.st-row')[i]));
			}
		}

    /*$cells = $grid.find('div.st-cell');

    $cells.height($cells.first().width());

    $(window).on('resize',function(){
      $cells.height($cells.first().width());
    });*/
		$grid.show();

	}

  function addGridLabels(grid_selector, x_labels, y_labels){
    var $grid = convertNameToSelector(grid_selector);
    var label_width;

    var grid_width = $grid.width();
    var grid_height = $grid.height();

    // TODO, make more DRY
    /* X-Labels */
    // Left
    $('<div class="st-grid-label" data-location="left"></div>').hide().appendTo($grid).html(x_labels[0]);
    label_height_perc = $('.st-grid-label[data-location="left"]').outerHeight() / grid_height / 2 * 100;
    label_height_px = $('.st-grid-label[data-location="left"]').outerHeight() - 2;
    $('.st-grid-label[data-location="left"]').css({'left': '-' + label_height_px + 'px', 'top': (50 - label_height_perc) + '%', });
    // Right
    $('<div class="st-grid-label" data-location="right"></div>').hide().appendTo($grid).html(x_labels[1]);
    label_height_perc = $('.st-grid-label[data-location="right"]').outerHeight() / grid_height / 2 * 100;
    label_height_px = $('.st-grid-label[data-location="right"]').outerHeight() + 1;
    $('.st-grid-label[data-location="right"]').css({'right': '-'+ label_height_px + 'px', 'top': (50 - label_height_perc) + '%', });

    /* Y-Labels */
    // Top
    $('<div class="st-grid-label" data-location="top"></div>').hide().appendTo($grid).html(y_labels[0]);
    label_width_perc = $('.st-grid-label[data-location="top"]').outerWidth() / grid_width / 2 * 100;
    $('.st-grid-label[data-location="top"]').css({'top': 0, 'left': (50 - label_width_perc ) + '%'});
    // Bottom
    $('<div class="st-grid-label" data-location="bottom"></div>').hide().appendTo($grid).html(y_labels[1]);
    label_width_perc = $('.st-grid-label[data-location="bottom"]').outerWidth() / grid_width / 2 * 100;
    $('.st-grid-label[data-location="bottom"]').css({'bottom': 0, 'left': (50 - label_width_perc ) + '%'});

    $('.st-grid-label').show();
  }

	function submissionsToGridMarkup(subm_data, conf){
		var Grid = makeGridArray(subm_data, conf.gridSize);
		gridArrayToMarkup(conf.gridTarget, conf.colors, Grid);
    addGridLabels(conf.gridTarget, conf.xAxis, conf.yAxis)
	}

  function applyCommentFilters(){
    $('.st-comment-filter').each(function(i, el){
      var $el = $(el);
      var is_hidden= $el.hasClass('st-hide');
      var quadrant  = $el.attr('data-quadrant');

      var $quadrant_comments = $('.st-comment-container[data-quadrant="'+quadrant+'"]');
      if (!is_hidden){
        $quadrant_comments.show();
      }else{
        $quadrant_comments.hide();
      }
    })
  }

	function bindHandlers(){
		$grid.on('mouseover.tooltip', '.st-cell', function(e){
      $tooltip.css({
        left: e.pageX+2,
        top: e.pageY+2
      }).addClass('open');
		});

    $grid.on('mousemove.tooltip', '.st-cell', function(e){
      $tooltip.css({
        left: e.pageX+2,
        top: e.pageY+2
      });
    });

		$grid.on('mouseleave.tooltip', function(){
			$tooltip.removeClass('open');
		});

		$grid.on('click.form', '.st-cell', function(e){
			var $this = $(this);
			//var selected_id = $this.attr('data-cell-id');
			var submission_values = JSON.parse($this.attr('data-submission-value'));

      $('input.x').val(submission_values[0]);
      $('input.y').val(submission_values[1]);

      $('.st-selected').removeClass('st-selected');

      var diff = ($grid.offset().left + $grid.outerWidth()) - (e.pageX + 2 + $('div.st-form').outerWidth());

      $this.addClass('st-selected');
      $('div.st-form')
        .css({
          top: e.pageY + 2,
          left: (diff < 0) ? e.pageX - 2 - $('div.st-form').outerWidth() : e.pageX + 2
        });

      $grid.addClass('open');

		});

    /* FILTERS */
    $('.st-comment-filter').on('click', function(){
      var $el = $(this);
      var quadrant = $el.attr('data-quadrant');

      $el.toggleClass('st-hide');
      applyCommentFilters();
    });
	}

  function unbindHandlers() {
    $tooltip.remove();
    $grid.removeClass('submittable').off('mouseover.tooltip mousemove.tooltip mouseleave.tooltip click.form');

  }

	function updateGrid(new_data,config){
		submissionsToGridMarkup(new_data, config);
	}

  function whichQuadrant(x, y) {
    x = +x;
    y = +y;
    if (x < 0 && y < 0) {
      return 'topleft'
    } else if (x > 0 && y < 0) {
      return 'topright'
    } else if (x > 0 && y > 0) {
      return 'bottomright'
    } else if (x < 0 && y > 0) {
      return 'bottomleft'
    }
  }

  function submissionsToCommentsMarkup(data, config){
    var submissions = data.submissions,
        extent      = data.inputExtents[1], // Find the range to later calc the percentage of this comment
        $comments_container = convertNameToSelector(config.commentsTarget);

    var commentTemplateFactory = _.template($('#st-comment-template').html()),
        comment_markup;

    // Hide it so that it renders faster
    $comments_container.hide();
    // Add comments
    for (var i = 0; i < submissions.length; i++) {
      comment_markup = commentTemplateFactory(submissions[i]);
      $comments_container.append(comment_markup);
    }

    // Mini-map stuff
    // This scale would normally work using the range being 0 to 100
    // But you have to take into account the width of the circle
    // So subtract the dimensions of the circle (as a percentage of the total mini-map dimentions)
    var map_width = $('.st-mini-map').width();
    var map_height = $('.st-mini-map').height();
    
    // Make a dummy circle first so we can measure its dimensions
    $('body').append('<div class="st-mm-dot"></div>');
    var dot_width_perc  = $('.st-mm-dot').width() / map_width * 100;
    var dot_height_perc = $('.st-mm-dot').height() / map_height * 100;

    var userValueToCssPercentageLeft = new Scale(-1, 1, 0, (100  - dot_width_perc));
    var userValueToCssPercentageTop  = new Scale(-1, 1, 0, (100 - dot_height_perc));

    // Remove the dummy circle
    $('.st-mm-dot').remove();

    // Make the map
    $('.st-mini-map').each(function(i, el){
      var $el = $(el),
          x_val = submissions[i].x,
          y_val = submissions[i].y,
          x_pos = x_val / extent,
          y_pos = y_val / extent;

      $el.append('<div class="st-mm-quadrant"></div>')
         .append('<div class="st-mm-quadrant"></div>')
         .append('<div class="st-mm-quadrant"></div>')
         .append('<div class="st-mm-quadrant"></div>');

      $('<div class="st-mm-dot"></div>')
         .css('left', userValueToCssPercentageLeft(x_pos) + '%')
         .css('top', userValueToCssPercentageTop(y_pos) + '%').appendTo($el);

      // Say what quadrant you're in
      var quadrant = whichQuadrant(x_val, y_val);
      $el.parents('.st-comment-container').attr('data-quadrant', quadrant)

    });
    // Once the appends are done, show it
    $comments_container.show();
  }

	function createViz(data, config){
    // Create the Grid Viz!
		submissionsToGridMarkup(data, config);

    // Create the comments section
    submissionsToCommentsMarkup(data, config);

		//ADD: only bind if they haven't submitted?
		bindHandlers();

	}

	/*

    Generate a form element based on a form item in the config options.

    Returns a <div> with a label and whatever the element is.
    
    The element is one of:

    a <textarea>
    a <select> with <option>s,
    an <input> (for type="text", type="number", etc.)
    a <div> with several <inputs> (for type="radio" or type="checkbox")

  */

  function getFormElement(item) {

    var $el,
        $outer = $('<div></div>')
                  .addClass('st-form-item')
                  .toggleClass('required',item.required);

    $outer.append('<label>' + item.name + (item.required ? ' *' : '') + '</label>');

    if (item.name.toLowerCase() == 'x' || item.name.toLowerCase() == 'y') {

      return $('<input/>')
              .attr({
                type: 'hidden',
                name: item.field
              })
              .addClass(item.name.toLowerCase());

    } else if (item.type == 'textarea') {

      $el = $('<textarea></textarea>')
              .attr('name',item.field);
    
    } else if (item.type == 'select') {
      $el = $('<select></select>')
              .attr('name',item.field);

      $.each(item.choices,function(i,c){
        
        $el.append(

          $('<option></option>').text(c)

        );

      });

    } else if (item.type == 'radio' || item.type == 'checkbox') {

      $el = $('<div></div>');

      $.each(item.choices,function(i,c){

        var $i = $('<input/>').attr({
              name: item.field,
              type: item.type,
              value: c
            }),
            $s = $('<span/>').text(c);

        $el.append($i);
        $el.append($s);

      });
    } else {

      $el = $('<input/>').attr({
        name: item.field,
        type: item.type,
        value: ''
      });

    }

    $outer.append($el);

    return $outer;

  }

  /*
    Called upon successful form submission
  */
  function submitted(x,y,config) {

    try {

      //Big random number into localStorage to mark that they submitted it
      localStorage.setItem('st-id', Math.floor(Math.random()*999999999));

    } catch(e) {}

    //Take hover/click listeners off the grid
    existing_data.submissions.push({
      x: x,
      y: y
    });

    updateGrid(existing_data,config);

    $('div[data-cell-id="' + x + '-' + y + '"]').addClass('saved');
    $grid.removeClass('open');
    $('div.st-form').remove();
  }

  function stageData(grid_data,config) {
    grid_data = $.map(grid_data,function(d){
      d.x = ('x' in d) ? +d.x : +d.X;
      d.y = ('y' in d) ? +d.y : +d.Y;
      return d;
    });

    existing_data = {submissions: grid_data};
    if (config.inputExtents) existing_data.inputExtents = config.inputExtents

    // Create the Grid
    createViz(existing_data,config);

  }

  /*
    Initialize everything from a set of config options
  */
  function initFromConfig(config) {

    var $form = $('<form/>').attr('target','st-iframe'),
        $form_outer = $('<div/>').addClass('st-form'),
        $iframe = $('<iframe/>').addClass('st-iframe')
                    .attr({
                      name: 'st-iframe',
                      id: 'st-iframe'
                    });

    $grid = convertNameToSelector(config.gridTarget);

    $grid.addClass('submittable');

    $grid.before($iframe);

    if (config.dataSource.type == 'google') {

      Tabletop.init({ key: config.dataSource.url,
        callback: function(data) {
            stageData(data,config);
          },
        simpleSheet: true
      });

    } else if (config.dataSource.type == 'json') {
      $.getJSON(config.dataSource.url,function(data){
        stageData(data,config);
      });
    } else {
      $.get(config.dataSource.url,function(data){
        //Need to pick a parser for this
        //stageData(csv2json(data),config);
      });
    }

    //Don't populate the form or set listeners if they already submitted
    try {
      //Temporarily false to always draw the form
      if (localStorage.getItem('st-id') && false) {
        $grid.removeClass('submittable');
        return true;
      }
    } catch (e) {}

    //Add the listener for the iframe that will get the submission
    $iframe.on('load',function(){

      var x = $(this).data('x'),
          y = $(this).data('y');

      submitted(x,y,config);

    });

    //Set the form action
    $form.attr('action',config.dataDestination)
          .on('submit',function(){
            //When they submit, check for missing required fields
            $('.missing').removeClass('missing');

            var $missing = $.map(config.fields,function(f){

              var tag = (f.type == 'select' || f.type == 'textarea') ? f.type : 'input',
                  $tag = $(tag + '[name="' + f.field + '"]');


              if (f.required && (!$tag.val() || !$tag.val().length)) {
                return $tag;
              }

              return false;

            });

            $missing = $.grep($missing,function(f){
              return f !== false;
            });

            if ($missing.length) {

              $.each($missing,function(i,$m){

                $m.parentsUntil('form','div.st-form-item').addClass('missing');

              });

              return false;
            }

            $iframe.data({
              x: $('input.x').val(),
              y: $('input.y').val()
            })
            
            unbindHandlers();
            $(this).parent().addClass('loading');
            return true;

          });

    //Create the form fields
    $.each(config.fields,function(i,f){

      $form.append(getFormElement(f));

    });

    //Append a submit button
    $form.append('<input type="submit" value="Submit"/>');

    $close = $('<div/>').addClass('st-close')
                .html('X')
                .on('click',function(e){
                  $('.st-selected').removeClass('st-selected');
                  $grid.removeClass('open');
                });

    $form_outer.append($close);
    $form_outer.append($form);

    $grid.prepend($form_outer);

    $tooltip = $('<div/>').addClass('st-tooltip').html('Click to place yourself');

    $grid.prepend($tooltip);

  }

  //Main initializer
  function sentimentTracker(opt) {
    if (typeof opt == 'string') {
      $.getJSON(opt,initFromConfig);
    } else {
      initFromConfig(opt);
    }
  }

  sentimentTracker('sample-form-config.json');


}).call(this);