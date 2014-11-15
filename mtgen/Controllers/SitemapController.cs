using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using SimpleMvcSitemap;

namespace mtgen.Controllers
{
	public class SitemapController : Controller
	{
		// GET: /Sitemap/

		public ActionResult Index()
		{
			var nodes = new List<SitemapNode>();

			var allActiveSets = mtgen.Logic.SetLogic.Instance.SetStubs.Where(s => s.GeneratorCreatedDate.HasValue).OrderByDescending(s => s.GeneratorCreatedDate);

			// docs: https://github.com/uhaciogullari/SimpleMvcSitemap
			foreach (var set in allActiveSets)
			{
				var node = new SitemapNode("/" + set.Code.ToLower());
				node.LastModificationDate = DateTime.SpecifyKind(set.GeneratorCreatedDate.Value, DateTimeKind.Local);
				node.ChangeFrequency = ChangeFrequency.Monthly;
				nodes.Add(node);
			}

			return new SitemapProvider().CreateSitemap(HttpContext, nodes);
		}
	}
}