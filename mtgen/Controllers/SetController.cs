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
		public ActionResult Index(string setCode, string saved)
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

		[HttpPost]
		public JsonResult SaveDraw(string data)
		{
			var permanentUrl = "";
			var permaGuid = Convert.ToBase64String(Guid.NewGuid().ToByteArray()); // there is always a == at the end
			permaGuid = permaGuid.Substring(0, permaGuid.Length - 2);
			Session[permaGuid] = data;

			// this will return something like: http://localhost:1491/LoadDraw/?saved=ahlaYo3tP069pjTvizXlVg
			permanentUrl = Request.Url.ToString().Replace("SaveDraw","LoadDraw") + "?saved=" + permaGuid.ToString();

			return Json(permanentUrl, JsonRequestBehavior.AllowGet);
		}

		[HttpGet]
		public JsonResult LoadDraw(string saved)
		{
			// TODO: need to add some sort of counter for every LoadDraw called for a particular saved guid
			//	so we know which have been used/used a lot/not used and can be deleted
			var savedData = Session[saved];
			if (savedData == null)
			{
				return Json("No data", JsonRequestBehavior.AllowGet);
			}

			return Json(savedData, JsonRequestBehavior.AllowGet);
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