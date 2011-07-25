/*
Copyright (c) 2011 Jasper A. Visser, https://github.com/jasperavisser/jquery.graph/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*jslint browser: true, plusplus: true */
/*global jQuery: true */

(function ($) {
	"use strict";

	/**
	 * Get the containing block or blocks for the selected elements.
	 * 
	 * @returns jQuery Containing blocks of selected elements.
	 */
	$.fn.containingBlock = function () {
		var blocks = $();
		
		this.each(function () {
			var element = $(this).parent();
			while (element) {
				if (element.is("body") || ["absolute", "fixed"].indexOf(element.css("position")) !== false) {
					blocks = blocks.add(element);
					break;
				}
				element = element.parent();
			}
		});
		
		return blocks;
	};
	
	/**
	 * Create a directed graph layer from an HTML canvas element.
	 * 
	 * @param settings object Settings to use for the graph.
	 * 
	 * @returns jQuery Reference to self. 
	 */
	$.fn.graph = function (settings) {
		var that, edgeRenderers;

		// standard collection of edge renderers
		edgeRenderers = {
			
			/**
			 * Render a bezier edge between the bottom-center of the source
			 * element and the top-center of the target element.
			 *
			 * @param canvas jQuery Canvas element to draw on.
			 * @param source jQuery Source element
			 * @param target jQuery Target element
			 * @param color string Color to draw this edge in.
			 *
			 * @returns undefined
			 */
			bezier : function (canvas, source, target, color) {
				var sourceVertex, targetVertex, vertices, context;
				
				// get bezier vertices
				sourceVertex = {
					x : source.position().left + source.width() / 2,
					y : source.position().top + source.height()
				};
				targetVertex = {
					x : target.position().left + target.width() / 2,
					y : target.position().top
				};
				vertices = [
					sourceVertex,
					{ x : sourceVertex.x, y : sourceVertex.y + 100 },
					{ x : targetVertex.x, y : targetVertex.y - 100 },
					targetVertex
				];
				
				// the context
				context = canvas[0].getContext("2d");
	
				// draw bezier
				context.moveTo(vertices[0].x, vertices[0].y);
				context.bezierCurveTo(
					vertices[1].x,
					vertices[1].y,
					vertices[2].x,
					vertices[2].y,
					vertices[3].x,
					vertices[3].y
				);
				context.lineWidth = 1;
				context.strokeStyle = color; 
				context.stroke();
				
				// draw knob
				context.beginPath();
				context.arc(vertices[3].x, vertices[3].y, 4, 0, Math.PI * 2, true);
				context.closePath();
				context.strokeStyle = color;
				context.stroke();
				context.fillStyle = color;
				context.fill();
			},
		
			/**
			 * Render a straight edge between the bottom-center of the source
			 * element and the top-center of the target element.
			 *
			 * @param canvas jQuery Canvas element to draw on.
			 * @param source jQuery Source element
			 * @param target jQuery Target element
			 * @param color string Color to draw this edge in.
			 *
			 * @returns undefined
			 */
			straight : function (canvas, source, target, color) {
				var sourceVertex, targetVertex, context;
				
				// get vertices
				sourceVertex = {
					x : source.position().left + source.width() / 2,
					y : source.position().top + source.height()
				};
				targetVertex = {
					x : target.position().left + target.width() / 2,
					y : target.position().top
				};
				
				// the context
				context = canvas[0].getContext("2d");
	
				// draw bezier
				context.moveTo(sourceVertex.x, sourceVertex.y);
				context.lineTo(targetVertex.x, targetVertex.y);
				context.lineWidth = 1;
				context.strokeStyle = color; 
				context.stroke();
			}
		};
		
		/**
		 * Get the edge rendering function for the given input.
		 * 
		 * @param renderer string or function Name of the edge renderer, or an 
		 * edge-rendering function.
		 * 
		 * @returns function Edge-rendering function.
		 */
		function getEdgeRenderer(renderer) {
			if (typeof renderer === "function") {
				return renderer;
			}
			switch (renderer) {
			case "bezier":
				return edgeRenderers.bezier;
			default:
				return edgeRenderers.straight;
			}
		}
		
		/**
		 * Render edges from all source to all targets in the given group.
		 * 
		 * @param i int Index of the edge group to render.
		 * 
		 * @returns undefined
		 */
		that = this;
		function renderEdgeGroup(i) {
			
			// for each source
			that.edgeGroups[i].sources.each(function () {
				var source = $(this);
				
				// for each target
				that.edgeGroups[i].targets.each(function () {
					
					// render an edge
					getEdgeRenderer(that.settings.renderEdge)(that.canvas, source, $(this), that.edgeGroups[i].color);
				});
			});
		}
		
		/**
		 * Render edges for all groups.
		 * 
		 * @returns undefined
		 */
		that = this;
		function renderEdgeGroups() {
			var j;
			
			// redraw all edges
			for (j = 0; j < that.edgeGroups.length; j++) {
				renderEdgeGroup(j);
			}
		}
	
		// default settings
		this.defaults = {
			draggableNodes : true,
			renderEdge : "bezier",
			zindex : 1
		};
		
		// given settings override default settings
		this.settings = $.extend({}, this.defaults, settings);
		
		// create canvas
		this.canvas = $("<canvas>")
			.css("position", "absolute")
			.css("height", "100%")
			.css("left", "0px")
			.css("top", "0px")
			.css("width", "100%")
			.css("z-index", this.settings.zindex);
		this.append(this.canvas);
			
		// groups of edges between source & target nodes
		this.edgeGroups = [];
		
		// set of node elements
		this.nodes = $();
		
		/**
		 * Clear all edges from the graph.
		 * 
		 * @returns jQuery Reference to self.
		 */
		this.fnClear = function () {
			this.edgeGroups = [];
			return this;
		};
		
		/**
		 * Add edges to the graph from all given sources to all given targets.
		 *
		 * @param sources array(HTMLElement) or jQuery or selector Any number of source elements.
		 * @param targets array(HTMLElement) or jQuery or selector Any number of target elements.
		 *
		 * @returns jQuery Reference to self.
		 */
		that = this;
		this.fnEdge = function (sources, targets, color) {
			if (color === undefined) {
				color = "black";
			}
			return this.each(function () {
				var i = that.edgeGroups.push({
					sources : $(sources),
					targets : $(targets),
					color : color
				}) - 1;
				renderEdgeGroup(i);
			});
		};
		
		/**
		 * Add the given element to the graph as a node.
		 * 
		 * @param element HTMLElement or jQuery or selector Any number of elements that serve as
		 * nodes in the graph.
		 * 
		 * @returns jQuery Reference to self.
		 */
		that = this;
		this.fnNode = function (element) {
			that.nodes = that.nodes.add(element);
			return this;
		};
		
		/**
		 * Render the graph.
		 * 
		 * @returns jQuery Reference to self.
		 */
		this.fnRender = function () {
			
			// resize canvas
			this.canvas[0].width = this.canvas.width();
			this.canvas[0].height = this.canvas.height();
			
			// redraw all edges
			renderEdgeGroups();
			
			return this;
		};
		
		// initialize graph
		that = this;
		return this.each(function () {
				
			// if the containing block is body, re-render graph when window is resized
			if ($(this).is("body")) {
				$(window).bind("resize.graph", function () {
					that.fnRender();
				});
			}
		
			// when a node is dragged, re-render graph
			if (that.settings.draggableNodes) {
				$(window)
					.delegate("*", "drag.graph", function () {
						if (that.nodes.is(this)) {
							that.fnRender();
						}
					})
					.delegate("*", "dragstop.graph", function () {
						if (that.nodes.is(this)) {
							that.fnRender();
						}
					});
			}
			
			// render graph now
			that.fnRender();
		});
	};
	
}(jQuery));