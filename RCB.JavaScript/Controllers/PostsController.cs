using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCB.JavaScript.Models;
using System.Text.Json;

namespace RCB.JavaScript.Controllers
{

  [Route("api/[controller]")]
  [ApiController]
  public class PostsController : ControllerBase
  {
    private readonly MainDbContext _context;

    public PostsController(MainDbContext context)
    {
      _context = context;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Post>> GetPost(long id)
    {
      var post = await _context.Posts.FindAsync(id);
      post.HideColumnsByAuthLevel();

      if (post == null)
      {
        return NotFound();
      }

      return post;
    }

    private static List<Post> ToPostForset(
      List<Post> _posts,
      List<Post> _roots = null,
      List<Post> _baseRoots = null,
      int depth = 0)
    {
      var posts = _posts == null ? new List<Post> { } : _posts;
      var roots = _roots == null ? posts.Where(r => r.ParentPostId == null).ToList() : _roots;
      if (roots == null)
      {
        return new List<Post> { };
      }
      var baseRoots = depth == 0 ? roots : _baseRoots;
      var descendants = posts.Where(p =>
      {
        return !roots.Any(r => r.PostId == p.PostId);
      }).ToList();
      var foundChildren = roots.Aggregate(new List<Post> { }, (cs, r) =>
        {
          var children = descendants.Where(d => r.PostId == d.ParentPostId).ToList();
          r.Children = children;
          return children.Concat(cs).ToList();
        }).ToList();
      if (foundChildren.Count > 0)
      {
        return ToPostForset(descendants, foundChildren, baseRoots, depth + 1);
      }
      else
      {
        return baseRoots;
      }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Post>>>
    GetPosts([FromQuery(Name = "page")] ushort page = 1,
            [FromQuery(Name = "pageSize")] ushort pageSize = 15,
            [FromQuery(Name = "orderBy")] string orderBy = "updatedAt")
    {
      if (page == 0 || pageSize > 15)
      {
        return BadRequest();
      }
      var posts = await _context.Posts
          .FromSqlRaw($@"
          WITH RECURSIVE cte_org AS (
            SELECT p.""PostId"", p.""ParentPostId"" FROM ""Posts"" AS p
            WHERE p.""PostId"" In (
	  					          SELECT p.""PostId"" FROM ""Posts"" AS p 
	  					          WHERE p.""ParentPostId"" IS NULL
	  					          ORDER BY p.""PostId"" DESC
	  					          OFFSET {(page - 1) * pageSize} ROWS FETCH NEXT {pageSize} ROWS ONLY)
          UNION ALL
          SELECT p.""PostId"", p.""ParentPostId""
          FROM 
            ""Posts"" AS p
            INNER JOIN cte_org AS o
              ON o.""PostId"" = p.""ParentPostId""
          )
          SELECT ""Posts"".* FROM cte_org
          INNER JOIN ""Posts""
          ON ""Posts"".""PostId"" = cte_org.""PostId""
          ").AsNoTracking().ToListAsync();
      foreach (var p in posts)
      {
        p.HideColumnsByAuthLevel();
      }
      return ToPostForset(posts);
    }

    public class DeletePostForm
    {
      public string AccessToken { get; set; }
    }

    // DELETE: api/posts/5
    [HttpDelete("{id}")]
    public async Task<ActionResult<Post>> DeletePost(long id, DeletePostForm deletePostForm)
    {
      var post = await _context.Posts.FindAsync(id);
      if (post == null ||
          post.AccessToken == null ||
          (post.AccessToken != null && deletePostForm.AccessToken != post.AccessToken))
      {
        return NotFound();
      }
      post.IsDeleted = true;
      _context.Entry(post).State = EntityState.Modified;
      try
      {
        await _context.SaveChangesAsync();
      }
      catch (DbUpdateConcurrencyException)
      {
        if (!PostExists(id))
        {
          return NotFound();
        }
        else
        {
          throw;
        }
      }
      return NoContent();
    }

    // PUT: api/posts/5
    // [HttpPut("{id}")]
    // public async Task<IActionResult> PutTodoItem(long id, Post post)
    // {
    //   if (id != post.PostId)
    //   {
    //     return BadRequest();
    //   }

    //   _context.Entry(post).State = EntityState.Modified;

    //   try
    //   {
    //     await _context.SaveChangesAsync();
    //   }
    //   catch (DbUpdateConcurrencyException)
    //   {
    //     if (!PostExists(id))
    //     {
    //       return NotFound();
    //     }
    //     else
    //     {
    //       throw;
    //     }
    //   }

    //   return NoContent();
    // }

    public class PostForm
    {
      public string AuthorName { get; set; }
      public string Email { get; set; }
      public string Title { get; set; }
      public string Url { get; set; }
      public string AccessToken { get; set; }
      public ContentNode[] Content { get; set; }
      public long? ParentPostId { get; set; }
      public Post toPost()
      {
        return new Post
        {
          AuthorName = AuthorName,
          Email = Email,
          Title = Title,
          Url = Url,
          AccessToken = AccessToken,
          Content = Content,
          ParentPostId = ParentPostId,
        };
      }
    }

    // POST: api/posts
    [HttpPost]
    public async Task<ActionResult<Post>> CreatePost(PostForm postForm)
    {
      Post post = postForm.toPost();
      string ip = HttpContext.Connection.RemoteIpAddress.ToString();
      string anonymousId = Crypt.ComputeSha256Hash(ip).Substring(0, 8);
      post.AnnoymousId = anonymousId;
      _context.Posts.Add(post);
      await _context.SaveChangesAsync();

      post.HideColumnsByAuthLevel();
      return CreatedAtAction(nameof(GetPost), new { id = post.PostId }, post);
    }

    private bool PostExists(long id)
    {
      return _context.Posts.Any(e => e.PostId == id);
    }
  }
}

namespace RCB.JavaScript.Controllers
{
  using System.Text;
  using System.Security.Cryptography;
  public class Crypt
  {
    public static string ComputeSha256Hash(string rawData)
    {
      // Create a SHA256   
      using (SHA256 sha256Hash = SHA256.Create())
      {
        // ComputeHash - returns byte array  
        byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));

        // Convert byte array to a string   
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < bytes.Length; i++)
        {
          builder.Append(bytes[i].ToString("x2"));
        }
        return builder.ToString();
      }
    }

  }
}
