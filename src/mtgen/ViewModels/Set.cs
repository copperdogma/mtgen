using System;
using System.Collections.Generic;

namespace mtgen.ViewModels
{
    public class Set
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public int CardCount { get; set; }
        public string CardCountClass { get; set; }
        public bool Incomplete { get; set; } = false;
        public string CreatedText { get; set; }
        public string SetFile { get; set; } = "/sets.json";
        public IList<string> CardFiles { get; set; } = new List<string>() { "cardsMain.json", "cardsToken.json", "cardsOther.json" };
        public IList<string> PackFiles { get; set; } = new List<string>() { "packs.json" };
        public string ProductFile { get; set; } = "products.json";
        public string StartProductName { get; set; }

        public IList<Update> Updates { get; set; } = new List<Update>();

        public string Image { set; get; }
        public DateTime? GeneratorCreatedDate { set; get; }
        public DateTime? PrereleaseDate { get; set; }
        public DateTime? ReleaseDate { set; get; }

        public Set(string code, string name, string image, int cardCount,
            string generatorCreatedDate, string prereleaseDate, string releaseDate)
        {
            Code = code.ToLower();
            Name = name;
            Image = image;
            CardCount = cardCount;

            DateTime date;
            if (DateTime.TryParse(generatorCreatedDate, out date))
            {
                GeneratorCreatedDate = date;
            }
            if (DateTime.TryParse(prereleaseDate, out date))
            {
                PrereleaseDate = date;
            }
            if (DateTime.TryParse(releaseDate, out date))
            {
                ReleaseDate = date;
            }
        }
    }
}