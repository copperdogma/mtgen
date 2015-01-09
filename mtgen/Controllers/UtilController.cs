using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using mtgen.Models;
using Newtonsoft.Json;
using System.IO;

namespace mtgen.Controllers
{

	public class UtilController : Controller
	{
		// For each set, check all card numbers for uniqueness and presence.
		public ActionResult CheckCardNums()
		{
			var setSummaries = new List<SetCardNumSummary>();

			// for each view
			foreach (var set in Logic.SetLogic.Instance.SetStubs)
			{
				if (set.GeneratorCreatedDate.HasValue)
				{
					var setSummary = new SetCardNumSummary();
					setSummary.SetCode = set.Code;

					var allSetCards = Logic.SetLogic.Instance.GetAllCardsForSet(set.Code);
					foreach (var card in allSetCards)
					{
						if (string.IsNullOrWhiteSpace(card.Num))
						{
							setSummary.NonNumberedCards.Add(card.Title);
						}
						else
						{
							if (allSetCards.Count(c => string.Compare(c.Num, card.Num, true) == 0) > 1)
							{
								setSummary.DuplicateNumberedCards.Add(card.Num + ": " + card.Title);
							}
							else
							{
								setSummary.UniqueNumberedCards.Add(card.Num + ": " + card.Title);
							}
						}
					}
					setSummary.SortAll();
					setSummaries.Add(setSummary);
				}
			}
			// summarize by set/file: #of cards, # of unqiue cards, list of cards missing numbers or having non-unique numbers
			return View(setSummaries);
		}

	}
}