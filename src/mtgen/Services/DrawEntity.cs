using Microsoft.WindowsAzure.Storage.Table;

namespace mtgen.Services
{
    public class DrawEntity : TableEntity
    {
        public DrawEntity(string setCode, string drawId)
        {
            this.PartitionKey = setCode;
            this.RowKey = drawId;
        }

        public DrawEntity() { }

        [IgnorePropertyAttribute]
        public string DrawId
        {
            get { return this.RowKey; }
            set { this.RowKey = value; }
        }

        [IgnorePropertyAttribute]
        public string SetCode
        {
            get { return this.PartitionKey; }
            set { this.PartitionKey = value; }
        }

        public string Results { get; set; }
        public string UserDrawId { get; set; }
    }
}
