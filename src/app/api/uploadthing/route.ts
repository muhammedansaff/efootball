import { createRouteHandler } from "uploadthing/next";
import { UTApi } from "uploadthing/server";
import { ourFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
});

// DELETE endpoint to remove files from UploadThing
export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const url = data.url;
    
    if (!url) {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }
    
    // Extract file key from URL (everything after the last /)
    const fileKey = url.substring(url.lastIndexOf("/") + 1);
    
    const utapi = new UTApi();
    await utapi.deleteFiles(fileKey);

    return Response.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return Response.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
