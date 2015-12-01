using Microsoft.AspNet.Mvc;
using mtgen.ViewModels;
using mtgen.Services;
using System.Collections.Generic;
using System.Linq;

namespace mtgen.Controllers
{
    public class UtilController: Controller
    {
        private readonly ISetService _setService;

        public UtilController(ISetService setService)
        {
            _setService = setService;
        }

        // For each set, check all card numbers for uniqueness and presence.
        public ActionResult CheckCardNums()
        {
            var setSummaries = new List<SetCardNumSummary>();

            // for each view
            var setStubs = _setService.GetSetStubs();
            foreach (var set in setStubs)
            {
                if (set.GeneratorCreatedDate.HasValue)
                {
                    var setSummary = new SetCardNumSummary();
                    setSummary.SetCode = set.Code;

                    var allSetCards = _setService.GetAllCardsForSet(set.Code);
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
