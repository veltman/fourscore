var FourScore = function(opt){

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

  var isArray = Array.isArray || $.isArray;

  // http://bl.ocks.org/aubergene/7791133

  // This is a function
  function Normalizer(min, max) {
    return function(val) {
      return (val - min) / (max - min);
    }
  }

  // This is another
  function Interpolater(min, max, clamp) {
    return function(val) {
      val = min + (max - min) * val;
      return clamp ? Math.min(Math.max(val, min), max) : val;
    }
  }

  // This is a third
  function Scale(minDomain, maxDomain, minRange, maxRange, clamp) {
    var normalize = new Normalizer(minDomain, maxDomain);
    var interpolate = new Interpolater(minRange, maxRange, clamp);
    var _normalize = new Normalizer(minRange, maxRange);
    var _interpolate = new Interpolater(minDomain, maxDomain, clamp);
    var s = function(val) {
      return interpolate(normalize(val));
    };
    s.inverse = function(val) {
      return _interpolate(_normalize(val));
    };
    return s;
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
				grid = $.map(
          range(0,size),
          function(c) {
            return [$.map(range(0,size),
              function(b) {
                return {
                  submission_value: [Math.round(userValueToGridIdx.inverse(b)),Math.round(userValueToGridIdx.inverse(c))],
                  count: 0,
                  ids: []
                }
              }
            )]
          }
        ),
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

	function convertNameToSelector(selector){
		if (typeof selector == 'string') {

			if (selector.match(/#?[A-Za-z][A-Za-z0-9_-]+$/)) {
				return $('#' + selector.replace(/^#/,''));
			}
			return $(selector);
		}

		//ADD: if it's an element, return $(el);

		return selector;
	}

  function colorScaleFactory($grid, color_info, extents){
    var color_brewer_name;
    var bins;
    var colorScale;
    var hex;
    var fn;

    // If it's an array then it's a custom list, if not, it's color brewer styles
    if (!isArray(color_info)){
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
        square_value,
        submission_value,
        $cells,
        ids;

    $grid.find('.fs-row').remove();

    $grid.hide()
         .addClass('fs-grid');

    var colorScale = colorScaleFactory($grid, color_info, extents); // This will take a value and return a hex code

		// For every row in the grid, make a row element
		for (var i = 0; i < grid.length; i++ ){

			$('<div class="fs-row"></div>').appendTo($grid);

			// Now make a cell with the aggregate data
			for (var j = 0; j < grid.length; j++){

				square_value     = grid[i][j].count;
				submission_value = JSON.stringify(grid[i][j].submission_value);
				ids              = JSON.stringify(grid[i][j].ids);
        fill_color       = colorScale(square_value);

				$('<div class="fs-cell"></div>').css("width",((100 / grid.length) + "%")) // Subtract one for the margin on the right between cells
                                        .attr('data-submission-value', submission_value)
																			  .attr('data-ids', ids)
																			  .attr('data-cell-id', grid[i][j].submission_value[0] + '-' + grid[i][j].submission_value[1])
																			  .css('background-color', fill_color)
                                        .toggleClass('fs-axis-right',(!(grid.length % 2) && j == grid.length/2 - 1))
                                        .toggleClass('fs-axis-left',(!(grid.length % 2) && j == grid.length/2))
                                        .toggleClass('fs-axis-bottom',(!(grid.length % 2) && i == grid.length/2 - 1))
                                        .toggleClass('fs-axis-top',(!(grid.length % 2) && i == grid.length/2))
                                        .appendTo($($grid.find('.fs-row')[i]));

			}

      $('<div class="clear"></div>').appendTo($($grid.find('.fs-row')[i]));

		}

    if (localStorage.getItem('fs-cell')) {

      $('div[data-cell-id="' + JSON.parse(localStorage.getItem('fs-cell')).join('-') + '"]').addClass('saved');

    }

    $cells = $grid.find('div.fs-cell');

    $(window).on('resize',function(){
      $cells.css("height",$cells.first().outerWidth()+"px");
    });

		$grid.show();

    $cells.css("height",$cells.first().outerWidth()+"px");


	}

  function addGridLabels(grid_selector, x_labels, y_labels){
    var $grid = convertNameToSelector(grid_selector);
    var label_width;

    var grid_width = $grid.width();
    var grid_height = $grid.height();

    /* X-Labels */
    // Left
    $('<div class="fs-grid-label" data-location="left"></div>').hide().appendTo($grid).html(x_labels[0]);
    label_height_perc = $('.fs-grid-label[data-location="left"]').outerHeight() / grid_height / 2 * 100;
    label_height_padding_px = $('.fs-grid-label[data-location="left"]').outerHeight() - $('.fs-grid-label[data-location="left"]').height();
    label_width_px = $('.fs-grid-label[data-location="left"]').width() / 2;
    $('.fs-grid-label[data-location="left"]').css({'left': '-' + (label_width_px + label_height_padding_px - 1) + 'px', 'top': (50 - label_height_perc) + '%', });
    // Right
    $('<div class="fs-grid-label" data-location="right"></div>').hide().appendTo($grid).html(x_labels[1]);
    label_height_padding_px = $('.fs-grid-label[data-location="right"]').outerHeight() - $('.fs-grid-label[data-location="right"]').height();
    label_width_px = $('.fs-grid-label[data-location="right"]').width() / 2;

    $('.fs-grid-label[data-location="right"]').css({'right': '-'+ (label_width_px + label_height_padding_px - 2) +  'px', 'top': (50 - label_height_perc) + '%', });

    /* Y-Labels */
    // Top
    $('<div class="fs-grid-label" data-location="top"></div>').hide().appendTo($grid).html(y_labels[0]);
    label_width_perc = $('.fs-grid-label[data-location="top"]').outerWidth() / grid_width / 2 * 100;
    $('.fs-grid-label[data-location="top"]').css({'top': 0, 'left': (50 - label_width_perc ) + '%'});
    // Bottom
    $('<div class="fs-grid-label" data-location="bottom"></div>').hide().appendTo($grid).html(y_labels[1]);
    label_width_perc = $('.fs-grid-label[data-location="bottom"]').outerWidth() / grid_width / 2 * 100;
    $('.fs-grid-label[data-location="bottom"]').css({'bottom': 0, 'left': (50 - label_width_perc ) + '%'});

    $('.fs-grid-label').show();
  }

	function submissionsToGridMarkup(subm_data, conf){
		var Grid = makeGridArray(subm_data, conf.options.gridSize);
		gridArrayToMarkup(conf.options.gridTarget, conf.options.colors, Grid);
    addGridLabels(conf.options.gridTarget, conf.options.xAxis, conf.options.yAxis)
	}

  function applyCommentFilters(){
    $('.fs-comment-filter').each(function(i, el){
      var $el = $(el);
      var is_hidden= $el.hasClass('fs-hide');
      var quadrant  = $el.attr('data-quadrant');

      var $quadrant_comments = $('.fs-comment-container[data-quadrant="'+quadrant+'"]');
      if (!is_hidden){
        $quadrant_comments.show();
      }else{
        $quadrant_comments.hide();
      }
    })
  }

	function bindHandlers(formExists){

    //Move the tooltip
    $grid.on('mouseover.tooltip', '.fs-cell', function(e){

      var gridOffset = $grid.offset();

      $tooltip.css({
        left: e.pageX+2 - gridOffset.left,
        top: e.pageY+2 - gridOffset.top
      }).addClass('open');

		});

    //Move the tooltip
    $grid.on('mousemove.tooltip', '.fs-cell', function(e){

      var gridOffset = $grid.offset();

      $tooltip.css({
        left: e.pageX+2 - gridOffset.left,
        top: e.pageY+2 - gridOffset.top
      });
    });

    //Close the tooltip
		$grid.on('mouseleave.tooltip', function(){
			$tooltip.removeClass('open');
		});

    //Open the form when a cell is clicked, or submit the form if there are no extra fields
		$grid.on('click.form', '.fs-cell', function(e){

      var $this = $(this),
          gridOffset =  $grid.offset(),
          gridWidth = $grid.outerWidth(),
          $formDiv = $('div.fs-form'),
          formWidth = $formDiv.outerWidth(),
          formLeft = e.pageX + 2,
          submission_values = JSON.parse($this.attr('data-submission-value'));

      $('input.x').val(submission_values[0]);
      $('input.y').val(submission_values[1]);

      $('.fs-selected').removeClass('fs-selected');
      $this.addClass('fs-selected');

      if (!formExists) {
        $formDiv.find("form").submit();
        return true;
      }

      //Math for where to position the form
      if (e.pageX + 2 + formWidth > gridOffset.left + gridWidth) formLeft -= 4 + formWidth;

      $formDiv
        .css({
          top: e.pageY + 2 - gridOffset.top,
          left: formLeft - gridOffset.left
        });

      $grid.addClass('open');

		});

    //Listeners for quadrant filters
    $('.fs-comment-filter').on('click', function(){
      var $el = $(this);
      var quadrant = $el.attr('data-quadrant');

      $el.toggleClass('fs-hide');
      applyCommentFilters();
    });
	}

  //Take off all the grid listeners
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
        $comments_container = convertNameToSelector(config.options.commentsTarget);

    if ($comments_container.length){
      var $template = $('#fs-comment-template'),
          commentTemplateFactory,
          comment_markup;

      switch($template.data("template-type").toLowerCase()) {
        case "underscore":
          commentTemplateFactory = _.template($template.html());
          break;
        case "handlebars":
          commentTemplateFactory = Handlebars.compile($template.html());
          break;
      }

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
      var map_width = $('.fs-mini-map').width();
      var map_height = $('.fs-mini-map').height();

      // Make a dummy circle first so we can measure its dimensions
      $('body').append('<div class="fs-mm-dot"></div>');
      var dot_width_perc  = $('.fs-mm-dot').width() / map_width * 100;
      var dot_height_perc = $('.fs-mm-dot').height() / map_height * 100;

      var userValueToCssPercentageLeft = new Scale(-1, 1, 0, (100  - dot_width_perc));
      var userValueToCssPercentageTop  = new Scale(-1, 1, 0, (100 - dot_height_perc));

      // Remove the dummy circle
      $('.fs-mm-dot').remove();

      // Make the map
      $('.fs-mini-map').each(function(i, el){
        var $el = $(el),
            x_val = submissions[i].x,
            y_val = submissions[i].y,
            x_pos = x_val / extent,
            y_pos = y_val / extent;

        $el.append('<div class="fs-mm-quadrant"></div>')
           .append('<div class="fs-mm-quadrant"></div>')
           .append('<div class="fs-mm-quadrant"></div>')
           .append('<div class="fs-mm-quadrant"></div>');

        $('<div class="fs-mm-dot"></div>')
           .css('left', userValueToCssPercentageLeft(x_pos) + '%')
           .css('top', userValueToCssPercentageTop(y_pos) + '%').appendTo($el);

        // Say what quadrant you're in
        var quadrant = whichQuadrant(x_val, y_val);
        $el.parents('.fs-comment-container').attr('data-quadrant', quadrant)

      });
      // Once the appends are done, show it
      $comments_container.show();

      // Show the coment filters if they've put this as the name
      if ($('#fs-comment-filters').length) $('#fs-comment-filters').show();
    }

  }

	function createViz(data, config){
    // Create the Grid Viz!
		submissionsToGridMarkup(data, config);

    // Create the comments section
    submissionsToCommentsMarkup(data, config);

    if (!localStorage.getItem('fs-cell')) {

      bindHandlers($.grep(config.fields || [],function(d){
        return d.name.toLowerCase() != "x" && d.name.toLowerCase() != "y";
      }).length);

    }

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
                  .addClass('fs-form-item')
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
      localStorage.setItem('fs-cell',JSON.stringify([x,y]));
    } catch(e) {}

    //Take hover/click listeners off the grid
    existing_data.submissions.push({
      x: x,
      y: y
    });

    updateGrid(existing_data,config);

    $('div[data-cell-id="' + x + '-' + y + '"]').addClass('saved');
    $grid.removeClass('open');
    $('div.fs-form').remove();
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

    var $form = $('<form/>').attr('target','fs-iframe'),
        $form_outer = $('<div/>').addClass('fs-form'),
        $iframe = $('<iframe/>').addClass('fs-iframe')
                    .attr({
                      name: 'fs-iframe',
                      id: 'fs-iframe'
                    });

    $grid = convertNameToSelector(config.options.gridTarget);

    $grid.addClass('submittable');

    $grid.before($iframe);

    if (config.options.dataSource.type == 'google') {

      Tabletop.init({ key: config.options.dataSource.url,
        callback: function(data) {
            stageData(data,config);
          },
        simpleSheet: true
      });

    } else if (config.options.dataSource.type == 'json') {
      $.getJSON(config.options.dataSource.url,function(data){
        stageData(data,config);
      });
    } else {
      $.get(config.options.dataSource.url,function(data){
        //Need to pick a parser for this
        //stageData(csv2json(data),config);
      });
    }

    //Don't populate the form or set listeners if they already submitted
    try {
      //If they've already submitted, don't let them resubmit
      if (localStorage.getItem('fs-cell')) {
        $grid.removeClass('submittable');
        return true;
      }
    } catch (e) {}

    //Add the listener for the iframe that will get the submission
    $iframe.on('load',function(){

      var x = $(this).data('x'),
          y = $(this).data('y');
      if (+x || +y || x+"" == "0" || y+"" == "0") submitted(x,y,config);

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

                $m.parentsUntil('form','div.fs-form-item').addClass('missing');

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
    $.each(config.fields || [],function(i,f){

      $form.append(getFormElement(f));

    });

    //Append a submit button
    $form.append('<input id="fs-form-submit" type="submit" value="Submit"/>');
    $form.append('<div id="fs-form-submit-loading">Submitting...<img src="imgs/ajax-loader.gif"/></div>');

    $close = $('<div/>').addClass('fs-close')
                .html('X')
                .on('click',function(e){
                  $('.fs-selected').removeClass('fs-selected');
                  $grid.removeClass('open');
                });

    $form_outer.append($close);
    $form_outer.append($form);

    $grid.prepend($form_outer);

    $tooltip = $('<div/>').addClass('fs-tooltip').html('Click to place yourself');

    $grid.prepend($tooltip);

  }

  if (typeof opt == 'string') {
    $.getJSON(opt,initFromConfig);
  } else {
    initFromConfig(opt);
  }

  return this;

};