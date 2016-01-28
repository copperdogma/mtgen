using System.Threading.Tasks;

namespace mtgen.Services
{
    public interface IStorageContext
    {
        Task<string> SaveDraw(DrawEntity pullEntity);
        Task<DrawEntity> LoadDraw(string setCode, string drawId);
    }
}