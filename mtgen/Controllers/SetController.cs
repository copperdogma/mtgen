using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace mtgen.Controllers
{
    public class SetController : Controller
    {
		// GET: { 3-letter set name }
		public ActionResult Index(string setCode)
		{
			var lowerCaseSetCode = setCode.ToLower();
			ViewBag.SetCode = lowerCaseSetCode;
			if (ViewExists(lowerCaseSetCode))
			{
				return View(lowerCaseSetCode);
			}
			else if (Logic.SetLogic.Instance.SetExists(setCode))
			{
				var setStub = Logic.SetLogic.Instance.GetSetStub(setCode);
				ViewBag.SetName = setStub.Name;
				return View("ErrorSetNotYetCreated");
			}
			return View("ErrorNoSuchSet");
		}
		public ActionResult IndexTest(string setCode)
		{
			var lowerCaseSetCode = setCode.ToLower();
			ViewBag.SetCode = lowerCaseSetCode;
			if (SetViewExists(lowerCaseSetCode))
			{
				//return View(lowerCaseSetCode);
				var path = string.Format("~/Views/{0}/Index.cshtml", lowerCaseSetCode);
				return View(path);
			}
			else if (Logic.SetLogic.Instance.SetExists(setCode))
			{
				var setStub = Logic.SetLogic.Instance.GetSetStub(setCode);
				ViewBag.SetName = setStub.Name;
				return View("ErrorSetNotYetCreated");
			}
			return View("ErrorNoSuchSet");
		}
		private bool SetViewExists(string name)
		{
			var path = Server.MapPath("~/Views/" + name.Trim());
			var findResult = System.IO.Directory.Exists(path);
			return findResult;
		}
		private bool ViewExists(string name)
		{
			var findResult = ViewEngines.Engines.FindView(ControllerContext, name, null);
			return (findResult.View != null);
		}
	}
}