using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using mtgen.Services;

namespace mtgen
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // The _? at the end is to take care of reserved words like "con" which I needed to make "con_"
            services.AddRazorPages()
                .AddRazorPagesOptions(options =>
                {
                    options.Conventions.AddPageRoute("/SingleSet", "{setCode:regex(^[a-zA-Z0-9]{{3}}_?$)}");
                });


            // Add framework services.
            services.Configure<ConnectionStrings>(Configuration.GetSection("ConnectionStrings"));

            services.AddMvc(); // For API (draws)

            // Add application services.
            services.AddTransient<ISetService, SetService>();            services.AddTransient<IStorageContext, StorageContext>();        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            // DISABLED FOR NOW (it wasn't enabled on the pre-Core version and I need to do some work)
            //app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapRazorPages();

                endpoints.MapControllers(); // For API (draws) and proxy
            });
        }
    }
}