using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using System.Text.Json;

namespace RCB.JavaScript.Models
{
  public class ContentNode
  {
    public string type { get; set; }
    public string text { get; set; }
    public bool bold { get; set; }
    public bool italic { get; set; }
    public bool underlined { get; set; }
    public bool code { get; set; }
    public ContentNode[] children { get; set; }
  }

  public class Post
  {
    [Key]
    public long PostId { get; set; }
    public string Variant { get; set; }
    [MaxLength(30)]
    public string AuthorName { get; set; }
    [Required]
    public string AnnoymousId { get; set; }
    [MaxLength(100)]
    public string Email { get; set; }
    [MaxLength(300)]
    public string Title { get; set; }
    [MaxLength(10000)]
    public string Url { get; set; }
    [MaxLength(8)]
    public string AccessToken { get; set; }
    public bool IsDeleted { get; set; }
    public int Likes { get; set; }
    public int Dislikes { get; set; }
    [Column(TypeName = "jsonb")]
    public ContentNode[] Content { get; set; }
    public long? ParentPostId { get; set; }
    public virtual List<Post> Children { get; set; }
    public virtual Post Parent { get; set; }
    public System.DateTime CreatedAt { get; set; }
    public System.DateTime UpdatedAt { get; set; }

    public const int GusetAuthLevel = 1;

    public void HideColumnsByAuthLevel(int authLevel = GusetAuthLevel)
    {
      if (authLevel == GusetAuthLevel)
      {
        AccessToken = null;
      }
      if (IsDeleted)
      {
        Content = null;
      }
    }

    public Post ShallowCopy()
    {
      return (Post)this.MemberwiseClone();
    }
  }
}