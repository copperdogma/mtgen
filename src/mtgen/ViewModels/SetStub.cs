using System;

namespace mtgen.ViewModels
{
    public class SetStub
	{
		public string Code { set; get; }
		public string Name { set; get; }
		public string Image { set; get; }
		public DateTime? GeneratorCreatedDate { set; get; }
		public DateTime? PrereleaseDate { get; set; }
		public DateTime? ReleaseDate { set; get; }

		public SetStub(string code, string name, string image,
			string generatorCreatedDate, string prereleaseDate, string releaseDate)
		{
			this.Code = code;
			this.Name = name;
			this.Image = image;

			DateTime date;
			if (DateTime.TryParse(generatorCreatedDate, out date))
			{
				this.GeneratorCreatedDate = date;
			}
			if (DateTime.TryParse(prereleaseDate, out date))
			{
				this.PrereleaseDate = date;
			}
			if (DateTime.TryParse(releaseDate, out date))
			{
				this.ReleaseDate = date;
			}
		}
	}
}