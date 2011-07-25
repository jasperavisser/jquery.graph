/*jslint browser: true, plusplus: true */
/*global jQuery: true */

(function ($) {
	"use strict";

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
			 * @param source jQuery Source element
			 * @param target jQuery Target element
			 *
			 * @returns undefined
			 */
			bezier : function (source, target, color) {
				var sourceVertex, targetVertex, vertices, context;
				
				// get bezier vertices
				sourceVertex = {
					x : source.position().left - $(window).scrollLeft() + source.width() / 2,
					y : source.position().top - $(window).scrollTop() + source.height()
				};
				targetVertex = {
					x : target.position().left - $(window).scrollLeft() + target.width() / 2,
					y : target.position().top - $(window).scrollTop()
				};
				vertices = [
					sourceVertex,
					{ x : sourceVertex.x, y : sourceVertex.y + 100 },
					{ x : targetVertex.x, y : targetVertex.y - 100 },
					targetVertex
				];
				
				// the context
				context = $("canvas")[0].getContext("2d");
	
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
			 * @param source jQuery Source element
			 * @param target jQuery Target element
			 *
			 * @returns undefined
			 */
			straight : function (source, target, color) {
				var sourceVertex, targetVertex, context;
				
				// get vertices
				sourceVertex = {
					x : source.position().left - $(window).scrollLeft() + source.width() / 2,
					y : source.position().top - $(window).scrollTop() + source.height()
				};
				targetVertex = {
					x : target.position().left - $(window).scrollLeft() + target.width() / 2,
					y : target.position().top - $(window).scrollTop()
				};
				
				// the context
				context = $("canvas")[0].getContext("2d");
	
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
					var target = $(this);
					
					// render an edge
					getEdgeRenderer(that.settings.renderEdge)(source, target, that.edgeGroups[i].color);
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
			renderEdge : "bezier"
		};
		
		// given settings override default settings
		this.settings = $.extend({}, this.defaults, settings);
	
		// groups of edges between source & target nodes
		this.edgeGroups = [];
		
		/**
		 * Add edges to the graph from all given sources to all given targets.
		 *
		 * @param sources array(HTMLElement) or jQuery Any number of source elements.
		 * @param targets array(HTMLElement) or jQuery Any number of target elements.
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
		 * @param element HTMLElement or jQuery Any number of elements that serve as
		 * nodes in the graph.
		 * 
		 * @returns jQuery Reference to self.
		 */
		that = this;
		this.fnNode = function (element) {
			element = $(element);
		
			// on drag, render graph
			if (that.settings.draggableNodes) {
				element.bind("drag.graph", function () {
					that.fnRender();
				});
			}
			
			return this;
		};
		
		/**
		 * Render the graph.
		 * 
		 * @returns jQuery Reference to self.
		 */
		this.fnRender = function () {
			
			// resize canvas
			$(this)[0].width = $(this).width();
			$(this)[0].height = $(this).height();
			
			// redraw all edges
			renderEdgeGroups();
			
			return this;
		};
		
		// initialize graph
		that = this;
		return this.each(function () {

			// on resize or scroll window, render graph
			$(window).bind("resize.graph", function () {
				that.fnRender();
			});
			$(window).bind("scroll.graph", function () {
				that.fnRender();
			});
			
			// render graph now
			that.fnRender();
		});
	};
	
}(jQuery));