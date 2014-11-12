using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(mtgen.Startup))]
namespace mtgen
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
