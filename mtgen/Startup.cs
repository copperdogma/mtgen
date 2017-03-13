using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using mtgen.Models;
using mtgen.Services;

namespace mtgen
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            if (env.IsDevelopment())
            {
                // For more details on using the user secret store see http://go.microsoft.com/fwlink/?LinkID=532709
                builder.AddUserSecrets<Startup>();
            }

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();
        }

        public IConfigurationRoot Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add framework services.
            services.Configure<ConnectionStrings>(Configuration.GetSection("ConnectionStrings"));

            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddDefaultTokenProviders();

            services.AddMvc();

            // Add application services.
            services.AddTransient<ISetService, SetService>();
            services.AddTransient<IStorageContext, StorageContext>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();

                // Browser Link is not compatible with Kestrel 1.1.0
                // For details on enabling Browser Link, see https://go.microsoft.com/fwlink/?linkid=840936
                // app.UseBrowserLink();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseStaticFiles();

            // Add external authentication middleware below. To configure them please see http://go.microsoft.com/fwlink/?LinkID=532715
            var cookieAuthenticationOptions = new CookieAuthenticationOptions()
            {
                AutomaticAuthenticate = true,
                AutomaticChallenge = true,
                LoginPath = "/Admin/Login"
            };
            app.UseCookieAuthentication(cookieAuthenticationOptions);

            // Add MVC to the request pipeline.
            app.UseMvc(routes =>
            {
                // The _? at the end is to take care of reserved words like "con" which I needed to make "con_"
                routes.MapRoute(
                    name: "set",
                    defaults: new { controller = "Set", action = "Index" },
                    template: "{setCode}/{action}",
                    constraints: new { setCode = @"^[a-zA-Z0-9]{3}_?$" });

                routes.MapRoute(
                    name: "set-LoadDraw",
                    defaults: new { controller = "Set", action = "LoadDraw" },
                    template: "{setCode}/LoadDraw/{drawId}",
                    constraints: new
                    {
                        setCode = @"^[a-zA-Z0-9]{3}_?$",
                        drawId = @"^[a-zA-Z0-9]+$"
                    });

                routes.MapRoute(
                    name: "proxy",
                    defaults: new { controller = "Proxy", action = "Index" },
                    template: "{url}");

                routes.MapRoute(
                    name: "areaRoute",
                    template: "{area:exists}/{controller=Home}/{action=Index}/{id?}");

                routes.MapRoute(
                        name: "default",
                        template: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}