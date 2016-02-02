using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using mtgen.Services;

namespace mtgen
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            // Set up configuration sources.
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            if (env.IsDevelopment())
            {
                // For more details on using the user secret store see http://go.microsoft.com/fwlink/?LinkID=532709
                builder.AddUserSecrets();
            }

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();
        }

        public IConfigurationRoot Configuration { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc();

            services.AddOptions();
            services.Configure<AzureConfiguration>(Configuration);

            // Add application services.
            services.AddTransient<ISetService, SetService>();
            services.AddTransient<IStorageContext, StorageContext>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            // FOR DEBUGGING:
            //app.UseDeveloperExceptionPage();

            if (env.IsDevelopment())
            {
                app.UseBrowserLink();
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseIISPlatformHandler(options => options.AuthenticationDescriptions.Clear());

            app.UseStaticFiles();

            app.UseCookieAuthentication(options => {
                options.AutomaticAuthenticate = true;
                options.AutomaticChallenge = true;
                options.LoginPath = "/Admin/Login";
            });

            // Add MVC to the request pipeline.
            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "set",
                    defaults: new { controller = "Set", action = "Index" },
                    template: "{setCode}/{action}",
                    constraints: new { setCode = @"^[a-zA-Z0-9]{3}$" });

                routes.MapRoute(
                    name: "set-LoadDraw",
                    defaults: new { controller = "Set", action = "LoadDraw" },
                    template: "{setCode}/LoadDraw/{drawId}",
                    constraints: new {
                        setCode = @"^[a-zA-Z0-9]{3}$",
                        drawId = @"^[a-zA-Z0-9]+$"
                    });

                routes.MapRoute(
                    name: "proxy",
                    defaults: new { controller = "Proxy", action = "Index" },
                    template: "{url}");

                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }

        // Entry point for the application.
        public static void Main(string[] args) => WebApplication.Run<Startup>(args);
    }
}
