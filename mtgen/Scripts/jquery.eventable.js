/**
* jquery.eventable
* Extend objects with events.
* https://github.com/jstonne/jquery.eventable
*
* Copyright (c) 2012 Jensen Tonne
* www.jstonne.com
*
* Dual licensed under the MIT and GPL licenses:
* http://www.opensource.org/licenses/mit-license.php
* http://www.gnu.org/licenses/gpl.html
*
*/


(function() {

	var instance = "___eventable",
		publicMethods = ["on", "off", "fire"],
		getEventName = function(name){
			return name.split(".")[0];
		};

	var Eventable = function(mode) {
		this.fnList = {};
		this.events = {};
		this.mode = mode;
	}

	$.extend(
		Eventable.prototype,
		{
			createEvent: function(name) {

				return this.events[name] = $.Callbacks(this.mode);
			},

			on: function(name, fn) {

				if (!name || !$.isFunction(fn)) return this;

				var fnList = this.fnList;

				(fnList[name] || (fnList[name] = [])).push(fn);

				// Translate into base event name
				var basename = getEventName(name);

				// Add the event
				(this.events[basename] || this.createEvent(basename)).add(fn);

				return this;
			},

			off: function(name) {

				if (!name) return this;

				var basename = getEventName(name),
					event = this.events[basename];

				if (!event) return this;

				var removeCallbacks = function(fnList) {

					$.each(fnList, function(i, fn) {
						event.remove(fn);
					});
				}

				if (basename!==name) {

					$.each(this.fnList, function(name, fnList) {

						if (name.indexOf(basename) > -1) {

							removeCallbacks(fnList);
						}
					});

				} else {

					removeCallbacks(this.fnList[name]);
				}

				return this;
			},

			fire: function(name) {

				var event = this.events[name];

				if (!event) return;

				event.fire.apply(event, $.makeArray(arguments).slice(1));

				return this;
			},

			destroy: function() {
				for (name in this.events) {
					this.events[name].disable();
				}
			}
		}
	);

	$.eventable = function(obj, mode) {

		var eventable = obj[instance];

		if (eventable && mode==="destroy") {
			eventable.destroy();
			$.deletes(obj, publicMethods);
			return delete obj[instance];
		}

		eventable = obj[instance] = new Eventable(mode);

		obj.on = $.proxy(eventable.on, eventable);
		obj.off = $.proxy(eventable.off, eventable);
		obj.fire = $.proxy(eventable.fire, eventable);

		return obj;
	}

})();
