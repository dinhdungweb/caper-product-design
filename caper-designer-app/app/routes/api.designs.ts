import { ActionFunctionArgs, json } from "@remix-run/node";
import prisma from "../db.server";
import crypto from "crypto";
import { authenticate } from "../shopify.server";

// CORS headers for App Proxy (Shopify App Proxy automatically handles some, but good practice for API routes)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // App Proxy requests from Shopify will contain a signature. 
  // In a production scenario, you must verify the signature. 
  // For this proxy endpoint, we'll extract the target shop from the URL query or headers.
  
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const { views, viewPreviews, viewTechniques, totalPrice, options } = await request.json();
    
    // In App Proxy request, shop is passed in query parameters: ?shop=your-shop.myshopify.com
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop") || "capercap.myshopify.com"; // Fallback for testing

    if (!viewPreviews || Object.keys(viewPreviews).length === 0) {
      return json({ error: "Missing design preview images" }, { status: 400, headers: corsHeaders });
    }

    const designId = `DESIGN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Note: In Cloud Deployment (Vercel, Render), you MUST upload base64 to S3, Cloudinary, AWS
    // For this boilerplate step, we will store the raw base64 or config in the DB.
    // Given the high size of base64 images, storing them directly in SQLite/Postgres is heavy but acceptable for immediate MVP.
    // Recommended: Upload to Cloudinary and store the URLs in `previewUrls`.
    
    // Creating stringified objects to store securely
    const canvasViewsStr = JSON.stringify({ views, options, viewTechniques });
    const previewUrlsStr = JSON.stringify(viewPreviews); // Contains Base64 strings for now

    // Save to Database
    const newDesign = await prisma.design.create({
      data: {
        id: designId,
        shop: shop,
        canvasViews: canvasViewsStr,
        previewUrls: previewUrlsStr,
        totalPrice: totalPrice,
      }
    });

    return json({
      success: true,
      design_id: newDesign.id,
      total_price: newDesign.totalPrice,
      previews: viewPreviews, // returning base64s to frontend just in case
    }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error('SERVER ERROR:', error);
    return json({ error: "Internal Server Error", details: error.message }, { status: 500, headers: corsHeaders });
  }
};
