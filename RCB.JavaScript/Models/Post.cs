using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
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
    public string url { get; set; }
    public ContentNode[] children { get; set; }

    private static IEnumerator<ContentNode> GetEnumeratorHelper(List<ContentNode> nodes)
    {
      var nextChildren = new List<ContentNode> { };
      foreach (var node in nodes)
      {
        yield return node;
        if (node.children != null)
        {
          nextChildren = nextChildren.Concat(node.children).ToList();
        }
      }
      if (nextChildren.Count > 0)
      {
        ContentNode.GetEnumeratorHelper(nextChildren);
      }
    }
    private IEnumerator GetBfEnumerator()
    {
      return ContentNode.GetEnumeratorHelper(new List<ContentNode> { this });
    }

    public int TextCount()
    {
      int count = 0;
      while (this.GetBfEnumerator().MoveNext())
      {
        if (text != null)
        {
          count += text.Count();
        }
      }
      return count;
    }
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
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; }
    [MaxLength(300)]
    public string Title { get; set; }
    [MaxLength(2000)]
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

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
      const int maxTextCount = 10000;
      int totalTextCount = this.Content.Sum((c) => c.TextCount());
      if (totalTextCount > maxTextCount)
      {
        yield return new ValidationResult($"Content length must less than {maxTextCount}",
                                                      new[] { "ContentLengthExceed" });
      }
    }

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