using Microsoft.EntityFrameworkCore.Migrations;

namespace RCB.JavaScript.Migrations
{
    public partial class postIdAndParent : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Posts_PostId_ParentPostId",
                table: "Posts",
                columns: new[] { "PostId", "ParentPostId" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Posts_PostId_ParentPostId",
                table: "Posts");
        }
    }
}
