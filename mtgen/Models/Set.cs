using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace mtgen.Models
{
	public class Set
	{
		public string Code { get; set; }
		public string Name { get; set; }
		public int CardCount { get; set; }
		public bool Incomplete { get; set; }
		public DateTime CreatedDate { get; set; }
		public string CreatedText { get; set; }
		public string SetFile { get; set; }
		public IList<string> CardFiles { get; set; }
		public IList<string> PackFiles { get; set; }
		public string ProductFile { get; set; }
		public string StartProductName { get; set; }

		public IList<Update> Updates { get; set; }

		public Set()
		{
			this.SetFile = "~/Content/sets.json";
			this.CardFiles = new List<string>() { "cardsMain.json", "cardsToken.json", "cardsOther.json" };
			this.PackFiles = new List<string>() { "packs.json" };
			this.ProductFile = "products.json";
			this.Incomplete = false;
			this.Updates = new List<Update>();
		}
	}
}