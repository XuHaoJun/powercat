using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using RCB.JavaScript.Models;

namespace RCB.JavaScript.Migrations
{
    public partial class InitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Posts",
                columns: table => new
                {
                    PostId = table.Column<long>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Variant = table.Column<string>(nullable: true),
                    AuthorName = table.Column<string>(maxLength: 30, nullable: true),
                    AnnoymousId = table.Column<string>(nullable: false),
                    Email = table.Column<string>(maxLength: 100, nullable: true),
                    Title = table.Column<string>(maxLength: 300, nullable: true),
                    Url = table.Column<string>(maxLength: 10000, nullable: true),
                    AccessToken = table.Column<string>(maxLength: 8, nullable: true),
                    IsDeleted = table.Column<bool>(nullable: false),
                    Likes = table.Column<int>(nullable: false),
                    Dislikes = table.Column<int>(nullable: false),
                    Content = table.Column<ContentNode[]>(type: "jsonb", nullable: true),
                    ParentPostId = table.Column<long>(nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Posts", x => x.PostId);
                    table.ForeignKey(
                        name: "FK_Posts_Posts_ParentPostId",
                        column: x => x.ParentPostId,
                        principalTable: "Posts",
                        principalColumn: "PostId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Posts_ParentPostId",
                table: "Posts",
                column: "ParentPostId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Posts");
        }
    }
}
