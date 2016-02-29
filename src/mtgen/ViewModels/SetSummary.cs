namespace mtgen.ViewModels
{
    public class SetSummary
	{
        public string Code { set; get; } // repeated for convenience of Invoke method

        public Set Set { get; set; }
    }
}