using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace mtgen.Models
{
	public class Card
	{
		public string Title { get; set; }
		public string SetCode { get; set; }
		public string Cost { get; set; }
		public string Rarity { get; set; }
		public string Type { get; set; }
		public string Subtype { get; set; }
		public string Power { get; set; }
		public string Toughness { get; set; }
		public string Colour { get; set; }
		public string Num { get; set; }
		public string GMTitle { get; set; }
		public string WotCTitle { get; set; }
		public string FinalTitle { get; set; }
		public string OriginalTitle { get; set; }
		public bool FixedViaException { get; set; }
		public string Src { get; set; }

	}
}