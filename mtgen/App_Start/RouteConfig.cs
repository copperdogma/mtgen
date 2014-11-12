using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
//using Anterec.ControllerLess.Mvc;

namespace mtgen
{
	public class RouteConfig
	{
		public static void RegisterRoutes(RouteCollection routes)
		{
			routes.LowercaseUrls = true; 
			routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

			routes.MapRoute(
				name: "Set",
				url: "{setCode}",
				defaults: new { controller = "Set", action = "Index", setCode = "thisssy" },
				constraints: new { setCode = @"^[a-zA-Z0-9]{3}$" }
			);

			//var route = new Route(
			//	url: "{setCode}",
			//	defaults: new RouteValueDictionary(new { controller = "Set", action = "IndexTest", id = UrlParameter.Optional }),
			//	constraints: new RouteValueDictionary(new { setCode = @"^[a-zA-Z0-9]{4}$" }),
			//	routeHandler: new ControllerLessRouteHandler());
			//routes.Add(route);

			routes.MapRoute(
				name: "SetTest",
				url: "{setCode}",
				defaults: new { controller = "Set", action = "IndexTest", setCode = "thisssy" },
				constraints: new { setCode = @"^[a-zA-Z0-9]{4}$" }
			);

			routes.MapRoute(
				name: "Default",
				url: "{controller}/{action}/{id}",
				defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
			);
		}
	}
}
