
using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace RCB.JavaScript.Models
{
  public class DbConfig
  {
    public static string Server { get; set; }
    public static string User { get; set; }
    public static string Pass { get; set; }
    public static string Port { get; set; }
    public static string Database { get; set; }
    public static string ConnectionString { get; set; }
  }

  public class MainDbContext : DbContext
  {
    public DbSet<Post> Posts { get; set; }
    public static readonly ILoggerFactory MyLoggerFactory
        = LoggerFactory.Create(builder => { builder.AddConsole(); });

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {

      // optionsBuilder.UseLazyLoadingProxies();
      optionsBuilder.UseLoggerFactory(MyLoggerFactory);

      //Get Database Connection 
      //Environment.SetEnvironmentVariable("DATABASE_URL", "postgres://ojunflcdtkendq:be88fc41989efe90fda30380a6dae8ec9259cc19f237f11135b68a52371a6ce5@ec2-54-235-146-51.compute-1.amazonaws.com:5432/d8lhbkcpmedcej");
      string _connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
      _connectionString.Replace("//", "");

      char[] delimiterChars = { '/', ':', '@', '?' };
      string[] strConn = _connectionString.Split(delimiterChars);
      strConn = strConn.Where(x => !string.IsNullOrEmpty(x)).ToArray();

      DbConfig.User = strConn[1];
      DbConfig.Pass = strConn[2];
      DbConfig.Server = strConn[3];
      DbConfig.Database = strConn[5];
      DbConfig.Port = strConn[4];
      DbConfig.ConnectionString = "host=" + DbConfig.Server + ";port=" + DbConfig.Port + ";database=" + DbConfig.Database + ";uid=" + DbConfig.User + ";pwd=" + DbConfig.Pass + ";sslmode=Require;Trust Server Certificate=true;Timeout=1000";
      optionsBuilder.UseNpgsql(DbConfig.ConnectionString);
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      base.OnModelCreating(modelBuilder);
      modelBuilder.Entity<Post>()
                  .HasMany(p => p.Children)
                  .WithOne(child => child.Parent)
                  .HasForeignKey(child => child.ParentPostId);

      modelBuilder.Entity<Post>()
          .Property(p => p.CreatedAt)
          .HasDefaultValueSql("now()");

      modelBuilder.Entity<Post>()
          .Property(p => p.UpdatedAt)
          .HasDefaultValueSql("now()");

      modelBuilder.Entity<Post>()
          .HasIndex(p => new { p.PostId, p.ParentPostId });
    }
  }
}