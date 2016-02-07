using System.Collections.Generic;
using System.Threading.Tasks;

namespace mtgen.Services
{
    public interface IStorageContext
    {
        Task<DrawEntity> GetDraw(string setCode, string drawId);
        Task<string> SaveDraw(DrawEntity pullEntity);
        Task<DrawEntity> LoadDraw(string setCode, string drawId);
        Task<IList<DrawEntity>> GetPopularDraws();
    }
}