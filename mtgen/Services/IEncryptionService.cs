namespace mtgen.Services
{
    public interface IEncryptionService
    {
        string DecryptString(string cipherText);
        string EncryptString(string text);
    }
}