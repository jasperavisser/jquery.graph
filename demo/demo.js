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
		var leftSide, rightSide, row, docWidth, docHeight, that, container;
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
		
		// get containing block
		container = this.containingBlock();
		docWidth = container.width();
		docHeight = container.height();
		
		// start at given row
		row = this.settings.row;
		
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
	node.attr("id", null);
	node.find(".title").text(properties.title);
	node.find(".description").text(properties.description);
	$("#container").append(node);
	node.draggable().show();
	
	return node;
}

$(function () {
	"use strict";
	
	var self, parents, children, i, graph, node;
	
	/// STEP 1: make some nodes ///////////////////////////////////////////////
	
	// create self node
	self = createNode({
		title : "Self 1",
		description : "Lorem ipsum and so on ..."
	});

	// create parent nodes
	parents = $();
	for (i = 2; i < 4; i++) {
		node = createNode({
			title : "Parent " + i,
			description : "Lorem ipsum and so on ..."
		});
		parents = parents.add(node);
	}
	
	// create child nodes
	children = $();
	for (i = 4; i < 16; i++) {
		node = createNode({
			title : "Child " + i,
			description : "Lorem ipsum and so on ..."
		});
		children = children.add(node);
	}
	
	/// STEP 2: lay them out nicely ///////////////////////////////////////////

	// layout magick
	parents.layout({
		row : -1,
		direction : "up"
	});
	self.layout();
	children.layout({
		row : 1,
		direction : "down"
	});

	/// STEP 3: create a directed graph ///////////////////////////////////////
	
	// create graph
	graph = $("#container").graph();

	// add nodes
	graph.fnNode(".node");

	// add edges
	graph.fnEdge(parents, self);
	graph.fnEdge(self, children);

	// some background text
	for (i = 0; i < 20; i++) {
		$("body").append($("p:first").clone().show());
	}
});