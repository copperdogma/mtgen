using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using System.IO;

namespace mtgen.Logic
{
	using Models;

	//HttpRuntime.Cache["key"] as Northwind.SuppliersDataTable;
	public class SetLogic
	{
		private static SetLogic instance;

		public IList<SetStub> SetStubs
		{
			get
			{
				return HttpRuntime.Cache["SetStubs"] as IList<SetStub>;
			}
			set
			{
				HttpRuntime.Cache["SetStubs"] = value;
			}
		}
		private SetLogic()
		{
		}

		public static SetLogic Instance
		{
			get
			{
				if (instance == null)
				{
					instance = new SetLogic();
				}
				return instance;
			}
		}

		public void Initialize()
		{
			// Load up the set stubs
			this.SetStubs = new List<SetStub>();
			var setsJson = File.ReadAllText(System.Web.HttpContext.Current.Server.MapPath("~/Content/sets.json"));
			this.SetStubs = JsonConvert.DeserializeObject<List<SetStub>>(setsJson);
		}

		public SetStub GetSetStub(string setCode)
		{
			return this.SetStubs.Where(s => String.Equals(s.Code, setCode, StringComparison.CurrentCultureIgnoreCase)).FirstOrDefault();
		}
		public bool SetExists(string setCode)
		{
			return (this.GetSetStub(setCode) != null);
		}

		public string GetPathForSetFile(string setCode, string fileName)
		{
			const string setPathFormat = "~/Content/{0}/{1}";
			return string.Format(setPathFormat, setCode.ToLower(), fileName);
		}
		public IList<Card> GetCardsFromJsonFile(string jsonFilePath)
		{
			//var xxx = this.GetPathForSetFile(set.Code, "cardsMain.json");
			var cardsPath = System.Web.HttpContext.Current.Server.MapPath(jsonFilePath);
			var cardsFile = System.IO.File.ReadAllText(cardsPath);
			var cards = Newtonsoft.Json.Linq.JArray.Parse(cardsFile).ToObject<IList<Card>>();
			return cards;
		}

		public IList<Card> GetMainCardsForSet(string setCode)
		{
			return this.GetCardsFromJsonFile(this.GetPathForSetFile(setCode, FilenameConstants.MainCards));
		}
		public IList<Card> GetTokenCardsForSet(string setCode)
		{
			return this.GetCardsFromJsonFile(this.GetPathForSetFile(setCode, FilenameConstants.TokenCards));
		}
		public IList<Card> GetOtherCardsForSet(string setCode)
		{
			return this.GetCardsFromJsonFile(this.GetPathForSetFile(setCode, FilenameConstants.OtherCards));
		}

		public IList<Card> GetAllCardsForSet(string setCode)
		{
			var cards = this.GetMainCardsForSet(setCode).ToList();
			cards.AddRange(this.GetTokenCardsForSet(setCode));
			cards.AddRange(this.GetOtherCardsForSet(setCode));
			return cards;
		}


	}
}