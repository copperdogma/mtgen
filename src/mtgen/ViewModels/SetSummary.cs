namespace mtgen.ViewModels
{
    public class SetSummary
	{
        public string Code { set; get; } // repeated for convenience of Invoke method

        public Set Set { get; set; }

        public bool IsCurrentSet { get; set; }
        public bool IsFutureSet { get; set; }

        public string CreatedTitle { get; set; }
        public string PrereleaseTitle { get; set; }
        public string ReleaseTitle { get; set; }
    }
}