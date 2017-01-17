using System;
using System.Collections.Generic;
using System.Diagnostics;

namespace mtgen.ViewModels
{
    [DebuggerDisplay("Code:{Code} Name:{Name} Block:{Block} IsFutureSet:{IsFutureSet}")]
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

        public bool IsCoreSet { get; set; }
        public string Block { get; set; }
        public bool IsBlockSet => !string.IsNullOrEmpty(Block);
        public IList<Set> BlockSets { get; set; } // will be filled in by HomeController for the Index page

        public bool IsFutureSet { get; set; }
        public bool IsCurrentSet { get; set; }

        public Set(string code, string name, string image, int cardCount,
            string generatorCreatedDate, string prereleaseDate, string releaseDate, 
            bool isCoreSet, string block, bool isCurrentSet, bool isFutureSet)
        {
            Code = code.ToLower();
            Name = name;
            Image = image;
            CardCount = cardCount;
            IsCoreSet = isCoreSet;
            Block = block;
            IsCurrentSet = isCurrentSet;
            IsFutureSet = isFutureSet;

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
		public Set()
		{
		}
		public void to_json()
		{
			System.IO.StringWriter sw = new System.IO.StringWriter();
			Newtonsoft.Json.JsonTextWriter jtw = new Newtonsoft.Json.JsonTextWriter(sw);
			Newtonsoft.Json.JsonSerializer js = new Newtonsoft.Json.JsonSerializer();

			jtw.Formatting = Newtonsoft.Json.Formatting.Indented;

			jtw.WriteStartObject();

				jtw.WritePropertyName("StartProductName");
				jtw.WriteValue(StartProductName);

				jtw.WritePropertyName("PackFiles");
				js.Serialize(jtw, PackFiles);

				jtw.WritePropertyName("CardFiles");
				js.Serialize(jtw, CardFiles);
				
				jtw.WritePropertyName("Updates");
				js.Serialize(jtw, Updates);

				if(CreatedText != null) {
					jtw.WritePropertyName("CreatedText");
					jtw.WriteValue(CreatedText);
				}

			jtw.WriteEndObject();

			System.Console.WriteLine(sw.ToString());
		}
    }
}
