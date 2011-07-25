/*jslint browser: true, plusplus: true */
/*global jQuery: true, $: true */

(function ($) {
	"use strict";

	/**
	 * Magically layout the selected elements on the page.
	 * 
	 * @param settings object Settings for auto-layout.
	 * 
	 * @returns jQuery Reference to selected elements.
	 */
	$.fn.layout = function (settings) {
		var leftSide, rightSide, row, docWidth, docHeight, that;
		leftSide = null; 
		rightSide = null;
			
		// defaults settings
		this.defaults = {
			direction : "down",
			minSpacing : 20,
			row : 0,
			rowHeight : 100
		};
		
		// given settings override defaults
		this.settings = $.extend({}, this.defaults, settings);
		
		// start at given row
		row = this.settings.row;
		
		docWidth = $(document).width();
		docHeight = $(document).height();
		
		// layout elements one-by-one
		that = this;
		return this.each(function () {
			var left, top;
			
			if (leftSide === null && rightSide === null) {
				left = (docWidth - $(this).width()) / 2;
				leftSide = left;
				rightSide = left + $(this).width();
			} else if (leftSide > docWidth - rightSide && leftSide > $(this).width() + that.settings.minSpacing) {
				left = leftSide - that.settings.minSpacing - $(this).width();
				leftSide = left;
			} else if (docWidth - rightSide > $(this).width() + that.settings.minSpacing) {
				left = rightSide + that.settings.minSpacing;
				rightSide = left + $(this).width();
			} else {
				left = (docWidth - $(this).width()) / 2;
				leftSide = left;
				rightSide = left + $(this).width();
				row = row + (that.settings.direction === "down" ? 1 : -1);
			}
	
			top = docHeight / 2 + row * that.settings.rowHeight;
			
			$(this)
				.css("left",  left)
				.css("top",  top);
		});
	};
	
}(jQuery));

/**
 * Create a HTML element representing a node in this demo.
 * 
 * @param properties object Properties of the node to be created.
 * 
 * @returns jQuery Elemented that was created. 
 */
function createNode(properties) {
	"use strict";
	var node = $("#nodeBase").clone();
	node.find(".title").text(properties.title);
	node.find(".description").text(properties.description);
	$("body").append(node);
	node.draggable().show();
	return node;
}