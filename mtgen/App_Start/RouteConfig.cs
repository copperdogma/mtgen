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

			// KILL: I like the new version better..
			//routes.MapRoute(
			//	name: "Set Images",
			//	url: "{setCode}/cards/{imageFilename}.{extension}",
			//	defaults: new { controller = "SetImages", action = "RedirectImageFile" },
			//	constraints: new { setCode = @"^[a-zA-Z0-9]{3}$", extension = @"(?i:^(jpg|jpeg|gif|png)$)" }
			//);

			// allows convention-based mapping on the actual controlers: http://blogs.msdn.com/b/webdev/archive/2013/10/17/attribute-routing-in-asp-net-mvc-5.aspx
			routes.MapMvcAttributeRoutes();

			routes.MapRoute(
				name: "Card Images",
				url: "cards/{imageFilename}.{extension}",
				defaults: new { controller = "SetImages", action = "RedirectCardImage" },
				constraints: new { extension = @"(?i:^(jpg|jpeg|gif|png)$)" }
			);

			routes.MapRoute(
				name: "Set",
				url: "{setCode}",
				defaults: new { controller = "Set", action = "Index" },
				constraints: new { setCode = @"^[a-zA-Z0-9]{3}$" }
			);

			routes.MapRoute(
				name: "Default",
				url: "{controller}/{action}/{id}",
				defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
			);
		}
	}
}
