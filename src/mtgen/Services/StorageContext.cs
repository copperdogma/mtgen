using System;
using System.Text;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Table;
using System.Threading.Tasks;
using Microsoft.Extensions.OptionsModel;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace mtgen.Services
{
    public class StorageContext : IStorageContext
    {
        private AzureConfiguration _azureConfiguration;

        private CloudTableClient _cloudDrawTableClient;

        private const string DrawTableName = "draw";

        public StorageContext(IOptions<AzureConfiguration> azureConfiguration)
        {
            _azureConfiguration = azureConfiguration.Value;

            // Retrieve the storage account from the connection string.
            var cloudStorageAccount = CloudStorageAccount.Parse(_azureConfiguration.AzureStorageConnectionString);

            // Create the table client.
            _cloudDrawTableClient = cloudStorageAccount.CreateCloudTableClient();
        }

        async private Task<CloudTable> GetDrawTable()
        {
            // Create the table if it doesn't exist.
            var drawTable = _cloudDrawTableClient.GetTableReference(DrawTableName);
            await drawTable.CreateIfNotExistsAsync();
            return drawTable;
        }

        async public Task<string> SaveDraw(DrawEntity drawEntity)
        {
            var uniqueDrawId = await GetUniqueId(drawEntity.SetCode);
            drawEntity.DrawId = uniqueDrawId;

            // Create the TableOperation object that inserts the customer entity.
            var insertOperation = TableOperation.Insert(drawEntity);

            // Execute the insert operation.
            var drawTable = await GetDrawTable();
            await drawTable.ExecuteAsync(insertOperation);

            return drawEntity.DrawId;
        }

        // Should't need this.. just for debugging. Use Cloud Explorer.
        async private void WriteContentsOfDrawTableToConsole()
        {
            var query = new TableQuery<DrawEntity>().Where(TableQuery.GenerateFilterCondition("PartitionKey", QueryComparisons.Equal, "xxx"));

            // Print the fields for each customer.
            var drawTable = await GetDrawTable();
            foreach (DrawEntity entity in await drawTable.ExecuteQuerySegmentedAsync(query, new TableContinuationToken()))
            {
                Console.WriteLine($"{entity.PartitionKey}, {entity.RowKey}\t{entity.Results.Substring(1, 100)}");
            }
        }

        async private Task<DrawEntity> GetDraw(string setCode, string drawId)
        {
            // Create a retrieve operation that takes a customer entity.
            var retrieveOperation = TableOperation.Retrieve<DrawEntity>(setCode, drawId);

            // Execute the retrieve operation.
            var drawTable = await GetDrawTable();
            var draw = await drawTable.ExecuteAsync(retrieveOperation);

            return draw.Result as DrawEntity;
        }

        async public Task<DrawEntity> LoadDraw(string setCode, string drawId)
        {
            var draw = await GetDraw(setCode, drawId);

            if (draw == null) return null;

            var jsonData = JObject.Parse(draw.Results);
            var useCount = jsonData.Value<int?>("useCount") ?? 1;
            useCount++;
            jsonData["useCount"] = useCount;
            jsonData["timestamp"] = draw.Timestamp;

            draw.Results = jsonData.ToString(Formatting.None); // Don't add spaces/returns.

            SaveDraw(draw); // Not guaranteed to finish running.

            return draw;
        }

        async private Task<string> GetUniqueId(string setCode)
        {
            var isUnique = false;

            // Keep generating IDs until we get a unique one (collisions should be vanishingly rare; 1/50billion).
            string possiblyUniqueId;
            do
            {
                possiblyUniqueId = GeneratePossiblyUniqueId();

                var draw = await GetDraw(setCode, possiblyUniqueId);

                if (draw == null)
                {
                    isUnique = true;
                }
            }
            while (!isUnique);

            return possiblyUniqueId;
        }

        private string GeneratePossiblyUniqueId()
        {
            var seed = new Random().Next();

            string alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            int numberBase = alphabet.Length;

            var stringSet = new StringBuilder();
            while (seed > 0)
            {
                stringSet.Append(alphabet[seed % numberBase]);
                seed = seed / numberBase;
            }

            return stringSet.ToString();
        }

    }
}
