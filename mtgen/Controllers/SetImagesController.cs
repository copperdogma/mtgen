using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace mtgen.Controllers
{
	public class SetImagesController : Controller
	{
		// For this to work I had to add this to web.config:
		//<handlers>
		//	<add
		//		name="SetImageHandler"
		//		path="*/cards/*"
		//		verb="GET"
		//		type="System.Web.Handlers.TransferRequestHandler"
		//		preCondition="integratedMode,runtimeVersionv4.0"
		//	/>
		//</handlers>
		//
		// via: http://stackoverflow.com/questions/16997963/asp-net-mvc-4-filepathresult-and-staticfile-handlers

		//KILL: I like the new one better
		//// GET: { 3-letter set name, imageFilename, image extension }
		//public ActionResult RedirectImageFile(string setCode, string imageFilename, string extension)
		//{
		//	string url = Url.Content(string.Format("~/Content/{0}/cards/{1}.{2}", setCode.ToLower(), imageFilename, extension));
		//	return base.File(url, "image/" + extension.ToLower());
		//}

		// GET: { 3-letter set name, imageFilename, image extension }
		public ActionResult RedirectCardImage(string imageFilename, string extension)
		{
			string url = Url.Content(string.Format("~/Content/cards/{0}.{1}", imageFilename, extension));
			return base.File(url, "image/" + extension.ToLower());
		}

	}
}