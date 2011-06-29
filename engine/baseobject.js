/**
 * The Render Engine
 * BaseObject
 *
 * @fileoverview The object from which most renderable engine objects will
 *               need to derive.
 *
 * @author: Brett Fattori (brettf@renderengine.com)
 * @author: $Author: bfattori $
 * @version: $Revision: 1573 $
 *
 * Copyright (c) 2011 Brett Fattori (brettf@renderengine.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

// The class this file defines and its required classes
R.Engine.define({
	"class": "R.engine.BaseObject",
	"requires": [
		"R.engine.PooledObject",
		"R.engine.Events"
	]
});

/**
 * @class The base object class which represents an object within
 * the engine.  Objects of this type can have an associated DOM element,
 * and will also inherit the {@link #update} method to perform processing
 * for every frame generated.
 * <p/>
 * This object also enhances the event handling provided by the {@link R.engine.Events event engine}.
 * It will remember events assigned to the object so that they can be automatically
 * cleaned up when the object is destroyed.
 * <p/>
 * If you are working with an object that represents an HTML element (node),
 * this object is ideal to extend from.  It has methods for assigning and
 * accessing that element.
 * <p/>
 * The {@link #update} method is called each time a frame is generated by the engine 
 * to update the object within the scene graph. In this method, you'll be able to 
 * update the internals of the object and perform general housekeeping.
 *
 * @param name {String} The name of the object
 * @extends R.engine.PooledObject
 * @constructor
 * @description Create a base object. 
 */
R.engine.BaseObject = function(){
	return R.engine.PooledObject.extend(/** @scope R.engine.BaseObject.prototype */{
	
		element: null,
		jQObject: undefined,
		events: null,
      eventListeners: null,
		
		/** @private */
		constructor: function(name){
			this.base(name);
			this.events = {};
         this.eventListeners = {};
			this.jQObject = undefined;
		},
		
		/**
		 * Destroy the object, cleaning up any events that have been
		 * attached to this object.  Calls the <tt>destroy</tt> event
       * before the object is destroyed.
		 */
		destroy: function(){
         // Trigger the "destroy" event before the object is destroyed
         this.triggerEvent("destroyed");

			// We need to make sure to remove any event's attached to us
			// that weren't already cleaned up
			for (var ref in this.events) {
				var fn = this.events[ref];
				var type = ref.split(",")[1];
				if (fn) {
					R.engine.Events.clearHandler(this.getElement(), type, fn);
				}
			}

         // Clean up non-element event listeners
         this.eventListeners = {};

			if (this.element != null && this.element != document) {
				$(this.element).empty().remove();
			}
			
			this.base();
		},
		
		/**
		 * Release the object back into the object pool.
		 */
		release: function(){
			this.base();
			this.element = null;
			this.events = null;
         this.eventListeners = null;
			this.jQObject = undefined;
		},
		
		/**
		 * Set the element which will represent this object within
		 * its rendering context.
		 *
		 * @param element {HTMLElement} The HTML element this object is associated with.
		 */
		setElement: function(element){
			this.element = element;
		},
		
		/**
		 * Get the element which represents this object within its rendering context.
		 *
		 * @return {HTMLElement} The HTML element
		 */
		getElement: function(){
			return this.element;
		},
		
		/**
		 * A helper method to provide access to the jQuery object wrapping the
		 * element for this object.  This allows direct access to the DOM.
		 *
		 * @return {jQuery} A jQuery object
		 */
		jQ: function(){
			if (!this.jQObject) {
            this.jQObject = this.element ? $(this.element) : null;
			}
         return this.jQObject;
		},
		
		/**
		 * Abstract update method to set the state of the object.  This method
		 * will be called each frame that is generated by the engine.  The
		 * context where the object will be rendered is passed, along with the
		 * current engine time.  Use this method to update components and
		 * perform housekeeping on the object.
		 *
		 * @param renderContext {R.rendercontexts.AbstractRenderContext} The context the object exists within
		 * @param time {Number} The current engine time, in milliseconds
       * @param dt {Number} The delta between the world time and the last time the world was updated
       *          in milliseconds.
		 */
		update: function(renderContext, time, dt){
		},
		
		/**
		 * Add an event handler to this object, as long as it has an associated HTML element. Within the
       * event handler, <tt>this</tt> refers to the object upon which the event is being triggered. It is
       * possible to bind an event simply by calling <tt>addEvent</tt> with the type and callback, like
       * so:
       * <pre>
       *    this.addEvent("click", function(evt) {
       *       this.doSomething(evt);
       *    });
       * </pre>
       * However, if you need to reference another object during the binding process, such as when
       * a render context is binding an event to a game object, you could pass a reference object
       * as the first argument:
       * <pre>
       *    // "this" refers to the render context
       *    someObj.addEvent(this, "click", function(evt) {
       *       // Inside the handler, "this" is the target of the event
       *       this.doSomething(evt);
       *    });
       * </pre>
       * The purpose behind this is that if the render context assigned the event, it should
       * probably remove the handler, rather than the game object needing to remove the handler.
       * But, if the game object <i>also</i> has a "click" handler, you don't want to remove
       * <i>that handler</i> since the game object may still need it.
		 *
		 * @param [ref] {Object} The object reference which is assigning the event
		 * @param type {String} The event type to respond to
		 * @param [data] {Array} Optional data to pass to the handler when it is invoked.
		 * @param fn {Function} The function to trigger when the event fires
		 */
		addEvent: function(ref, type, data, fn){
         ref = R.isString(ref) ? this : ref;

         // CAUTION: Brain Teaser
         fn = R.isString(ref) ? (R.isFunction(type) ? type : (R.isFunction(data) ? data : fn)) :
                R.isFunction(data) ? data : fn;
         data = R.isString(ref) ? (R.isFunction(type) ? null : (R.isFunction(data) ? null : data)) :
                  R.isFunction(data) ? null : data;
         // CAUTION -------------

			if (ref == null) {
				// This is a global assignment to the document body.  Many listeners
				// may collect data from the event handler.
				R.debug.Console.info("Global assignment of event '" + type + "'");
				R.engine.Events.setHandler(document.body, type, data || fn, fn);
				this.events["document," + type] = fn;
			}
			else {
            R.debug.Console.debug(ref.getName() + " attach event '" + type + "' to " + this.getName());
				if (this.getElement()) {
					R.engine.Events.setHandler(this.getElement(), type, data || fn, fn);
					
					// Remember the handler by the reference object's name and event type
					this.events[ref.getName() + "," + type] = fn;
				} else {
               // We want to be able to add event handlers to objects which don't
               // have an element associated with them as well
               var listeners = this.eventListeners[type.toUpperCase()];
               if (!listeners) {
                  listeners = this.eventListeners[type.toUpperCase()] = [];
               }

               // Add the new listener
               listeners.push({
                  id: ref.getName() + "," + type,
                  data: data,
                  callback: fn
               });
            }
         }
		},
		
		/**
		 * Remove the event handler assigned to the object for the given type.  The optional
       * <tt>ref</tt> argument is used when another object assigned the event handler, such as:
       * <pre>
       *    // Handler #1
       *    someObject.addEvent("click", function(evt) {
       *       this.doSomething(evt);
       *    });
       *
       *    // Handler #2
       *    someObject.addEvent(anotherObject, "click", function(evt) {
       *       this.doSomething(evt);
       *    });
       * </pre>
       * You would remove the "click" handler that <tt>anotherObject</tt> assigned (handler #2),
       * and not one that was bound by <tt>someObject</tt> (handler #1):
       * <pre>
       *    someObject.removeEvent(anotherObject, "click");
       * </pre>
		 *
		 * @param [ref] {Object} The object reference which assigned the event
		 * @param type {String} The event type to remove
		 */
		removeEvent: function(ref, type){
         var fn;
         ref = R.isString(ref) ? this : ref;
			if (ref == null) {
				// This was a global assignment to the document body.  Clean it up
				R.debug.Console.info("Global event '" + type + "' removed");
				fn = this.events["document," + type];
				R.engine.Events.clearHandler(document.body, type, fn);
			}
			else {
            R.debug.Console.info(ref.getName() + " remove event '" + type + "' from " + this.getName());
            var id = ref.getName() + "," + type;
				if (this.getElement()) {
					// Find the handler to remove
					fn = this.events[id];
					if (fn) {
						R.engine.Events.clearHandler(this.getElement(), type, fn);
					}
					// Remove the reference
					delete this.events[ref.getName() + "," + type];
				} else {
               var listeners = this.eventListeners[type.toUpperCase()];
               if (listeners) {
                  listeners = R.engine.Support.filter(listeners, function(e) {
                     return e.id !== id;
                  });
               }
            }
         }
		},

      /**
       * Trigger an event on the object.  Event handlers assigned with
       * {@link #addEvent} will be triggered and passed the event object
       * and the data.  The scope of the listener function will be the
       * object.
       * 
       * @param eventName {String} The event to trigger
       * @param data {Array} An array of data to pass to the event handler
       */
      triggerEvent: function(eventName, data) {
         if (this.element) {
            this.jQ().trigger(eventName, data);
         } else {
            var listeners = this.eventListeners[eventName.toUpperCase()];
            if (listeners) {
               data = data || [];

               // Make sure the first element is the event
               data.unshift($.Event({ type: eventName }));

               for (var e = 0; e < listeners.length; e++) {
                  var listener = listeners[e];

                  // Append the predefined listener data to the data object
                  if (listener.data) {
                     data = data.concat(listener.data);
                  }

                  // Call the listener
                  listener.callback.apply(this, data);
               }
            }
         }
      }
		
	}, /** @scope R.engine.BaseObject.prototype */ {
	
		/**
		 * Get the class name of this object
		 *
		 * @return {String} "R.engine.BaseObject"
		 */
		getClassName: function(){
			return "R.engine.BaseObject";
		}
		
	});
	
};