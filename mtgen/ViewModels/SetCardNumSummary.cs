using System.Collections.Generic;
using System.Linq;

namespace mtgen.ViewModels
{
    public class SetCardNumSummary
	{
		public SetCardNumSummary()
		{
			UniqueNumberedCards = new List<string>();
			DuplicateNumberedCards = new List<string>();
			NonNumberedCards = new List<string>();
		}
		public string SetCode { get; set; }
		public List<string> UniqueNumberedCards { get; set; }
		public List<string> DuplicateNumberedCards { get; set; }
		public List<string> NonNumberedCards { get; set; }

		public int TotalCardCount { get { return UniqueNumberedCards.Count() + DuplicateNumberedCards.Count() + NonNumberedCards.Count(); } }

		public void SortAll()
		{
			UniqueNumberedCards.Sort();
			DuplicateNumberedCards.Sort();
			NonNumberedCards.Sort();
		}

	}
}