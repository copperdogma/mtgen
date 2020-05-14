using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.RazorPages;
using mtgen.Models;
using mtgen.Services;

namespace mtgen.Pages.Util
{
    public class CheckCardNumsModel : PageModel
    {
        private readonly ISetService _setService;

        public IList<SetCardNumSummary> SetSummary { get; set; }

        public CheckCardNumsModel(ISetService setService)
        {
            _setService = setService;
        }   

        public void OnGet()
        {
            SetSummary = GetSetCardNumSummry();
        }

        // For each set, check all card numbers for uniqueness and presence.
        public IList<SetCardNumSummary> GetSetCardNumSummry()
        {
            var setSummaries = new List<SetCardNumSummary>();

            // for each view
            var sets = _setService.GetSets();
            foreach (var set in sets)
            {
                if (set.GeneratorCreatedDate.HasValue)
                {
                    var setSummary = new SetCardNumSummary()
                    {
                        SetCode = set.Code
                    };

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
                                setSummary.DuplicateNumberedCards.Add($"{card.Num}: {card.Title}");
                            }
                            else
                            {
                                setSummary.UniqueNumberedCards.Add($"{card.Num}: {card.Title}");
                            }
                        }
                    }
                    setSummary.SortAll();
                    setSummaries.Add(setSummary);
                }
            }

            // summarize by set/file: #of cards, # of unqiue cards, list of cards missing numbers or having non-unique numbers
            return setSummaries;
        }
    }
}